#!/usr/bin/env bash
# CI-naher Lauf aller Guard-Gates (npm run gates:ci): dieselben Schritte und Playwright-Projekte wie die Pipeline
# (.github/workflows/deploy.yml), aber nacheinander in einem Docker-Container mit so wenig Rechenkraft wie der Runner
# (2 CPUs, CPUS=4 für den 4-vCPU-Runner). Feste Wartezeiten, die auf 18 Kernen reichen, reißen erst hier. Strenger als
# die Pipeline: kein Wiederholen fehlgeschlagener Browser-Tests.
# Die Pipeline verteilt dieselben Schritte auf Jobs: static (Format, Lint, Architektur, Typen), coverage (npm test),
# build (Build, verify), e2e-site (Projekt site). Hier laufen sie nacheinander; vorher wird geprüft, dass die Pipeline
# jedes Projekt aus playwright.config.ts aufruft.
# Geprüft wird der Arbeitsstand samt nicht committeter Änderungen (ohne node_modules und Ignoriertes). Nach einem
# vollen grünen Lauf steht in .ci-local-ok der Tree-Hash des geprüften Stands – gleich `git rev-parse HEAD^{tree}`,
# sobald genau dieser Stand committet ist. Der Hook .githooks/pre-push verlangt ihn vor jedem Push.
# Aufruf: npm run gates:ci [-- <Argumente für playwright test>], etwa `npm run gates:ci -- e2e/retire.spec.ts` zum
# schnellen Prüfen (schreibt kein .ci-local-ok). Abhängigkeiten liegen in einem Image je package-lock.json, einmal gebaut.
set -euo pipefail

CPUS=${CPUS:-2}
E2E_WARN=120 # Browser-Tests über 2 min: Warnung, der Job der Pipeline hat 7 min samt Einrichten
ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"

sha256() { if command -v sha256sum >/dev/null; then sha256sum | cut -d' ' -f1; else shasum -a 256 | cut -d' ' -f1; fi; }
now() { date +%s; }

# Jedes Playwright-Projekt muss in einem Browser-Job der Pipeline stehen (--project=…), sonst liefe es nur hier
CONFIGURED=$(node -e "import('./playwright.config.ts').then((m) => console.log(m.default.projects.map((p) => p.name).sort().join(' ')))")
IN_CI=$(grep -o -- '--project=[a-z0-9-]*' .github/workflows/deploy.yml | sed 's/^--project=//' | LC_ALL=C sort -u | tr '\n' ' ')
if [ "$CONFIGURED" != "${IN_CI% }" ]; then
  echo "gates:ci: Playwright-Projekte ($CONFIGURED) und Browser-Jobs in deploy.yml (${IN_CI% }) passen nicht zusammen" >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "gates:ci: Docker läuft nicht – bitte starten" >&2
  exit 1
fi

# Playwright-Image genau zur Version aus package-lock.json (Browser und Testbibliothek müssen zusammenpassen)
PW=$(node -p "require('./package-lock.json').packages['node_modules/@playwright/test'].version")
BASE=mcr.microsoft.com/playwright:v$PW-noble

# Stand, der geprüft wird: Arbeitsbaum über einen eigenen Index als Tree, so wie git ihn committen würde
TMP=$(mktemp -d)
NAME=web-ci-local-$$-$(now)
cleanup() {
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT
trap 'exit 130' INT TERM
cp "$(git rev-parse --git-path index)" "$TMP/index" 2>/dev/null || true
GIT_INDEX_FILE=$TMP/index git add -A
TREE=$(GIT_INDEX_FILE=$TMP/index git write-tree)

# Image mit den Abhängigkeiten, benannt nach package-lock.json, .nvmrc und Basis-Image (Skripte in package.json zählen nicht)
DEPS_HASH=$(cat package-lock.json .nvmrc <(echo "$BASE") | sha256 | cut -c1-16)
DEPS=web-ci-deps:$DEPS_HASH
if ! docker image inspect "$DEPS" >/dev/null 2>&1; then
  echo "gates:ci: baue Abhängigkeiten ($DEPS, einmal je package-lock.json) …"
  mkdir "$TMP/ctx"
  cp package.json package-lock.json "$TMP/ctx/"
  printf '%s\n' "FROM $BASE" 'WORKDIR /work' 'COPY package.json package-lock.json ./' \
    'RUN npm ci --no-audit --no-fund' 'LABEL web-ci-deps=1' >"$TMP/ctx/Dockerfile"
  tar -C "$TMP/ctx" -c . | docker build -q -t "$DEPS" - >/dev/null
  # Ältere Fassungen aufräumen, sie werden nie wieder gebraucht
  docker images --filter label=web-ci-deps=1 --format '{{.Repository}}:{{.Tag}}' | grep -vx "$DEPS" |
    while read -r old; do docker rmi "$old" >/dev/null 2>&1 || true; done || true
fi
NODE_WANT=$(cat .nvmrc)
NODE_HAVE=$(docker run --rm "$DEPS" node -p 'process.versions.node.split(".")[0]')
if [ "$NODE_HAVE" != "${NODE_WANT%%.*}" ]; then
  echo "gates:ci: Warnung – Node $NODE_HAVE im Image, die Pipeline nutzt $NODE_WANT (.nvmrc)" >&2
fi

# Im Container: die Schritte der Pipeline-Jobs nacheinander, je mit Dauer
# shellcheck disable=SC2016
INNER='
set -uo pipefail
cd /work
step() {
  local name=$1 t=$SECONDS
  shift
  echo "::: $name"
  "$@"
  local rc=$?
  printf "::: %-14s %4ds%s\n" "$name" $((SECONDS - t)) "$([ $rc -eq 0 ] || echo "  FEHLER")"
  [ $rc -eq 0 ] || exit $rc
}
step format:check npm run --silent format:check
step lint npm run --silent lint
step arch npm run --silent arch
step check npm run --silent check
step test npm test --silent
step build npm run --silent build
step verify npm run --silent verify
step e2e env PLAYWRIGHT_HTML_OPEN=never npx playwright test --workers=2 --retries=0 --reporter=list,html "$@"
'

docker create --name "$NAME" --cpus="$CPUS" --memory=7g --shm-size=2g -e CI=1 -e ASTRO_TELEMETRY_DISABLED=1 \
  "$DEPS" bash -c "$INNER" gates-ci "$@" >/dev/null
git archive --format=tar "$TREE" | docker cp - "$NAME:/work"

echo "gates:ci: prüfe Tree $TREE mit $CPUS CPUs …"
START=$(now)
RC=0
docker start -a "$NAME" | tee "$TMP/log" || RC=$?
TOTAL=$(($(now) - START))

E2E=$(sed -n 's/^::: e2e *\([0-9]*\)s.*/\1/p' "$TMP/log")
echo "gates:ci: gesamt ${TOTAL}s, Browser-Tests ${E2E:-–}s ($CPUS CPUs)"
if [ -n "$E2E" ] && [ "$E2E" -gt "$E2E_WARN" ]; then
  echo "gates:ci: Warnung – Browser-Tests über $((E2E_WARN / 60)) min, der Job der Pipeline hat 7 min samt Einrichten" >&2
fi

if [ "$RC" -ne 0 ]; then
  for d in test-results playwright-report; do
    rm -rf "${ROOT:?}/$d"
    docker cp "$NAME:/work/$d" "$ROOT/$d" >/dev/null 2>&1 && echo "gates:ci: $d/ liegt im Arbeitsbaum"
  done
  echo "gates:ci: ROT – nicht wegerklären: Ursache finden (Trace: npx playwright show-trace test-results/…/trace.zip)" >&2
  [ $# -gt 0 ] || rm -f .ci-local-ok
  exit "$RC"
fi

if [ $# -eq 0 ]; then
  echo "$TREE" >.ci-local-ok
  echo "gates:ci: GRÜN – .ci-local-ok = $TREE"
else
  echo "gates:ci: grün mit Auswahl ($*) – .ci-local-ok bleibt unverändert, für den Push den vollen Lauf"
fi
