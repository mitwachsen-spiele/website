// shared board geometry
const T=-0.0525, c=1/Math.sqrt(1+T*T), s=T*c;
const O={x:2950,y:1940.4};
module.exports={O,cos:c,sin:s,angle:Math.atan(T),
 toUV:(x,y)=>{const dx=x-O.x,dy=y-O.y;return {u:dx*c+dy*s,v:-dx*s+dy*c}},
 toXY:(u,v)=>({x:O.x+u*c-v*s,y:O.y+u*s+v*c})};
