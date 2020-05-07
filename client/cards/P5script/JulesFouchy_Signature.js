p.push()
const ratio = 4.0 / 5.0 ;
p.noStroke() ;
p.fill( Math.floor(p.random(256)) , Math.floor(p.random(256)) , Math.floor(p.random(256)) , 100 ) ;
p.translate(p.width/2 , p.height/2) ;
let r = p.width/2 ;
p.ellipse( 0 , 0 , r*2 , r*2 ) ;
for( let k = 3 ; k < 20 ; ++k ){
  let angle = p.random(p.TAU) ;
  p.translate( r*(1-ratio) * p.cos(angle) , r*(1-ratio) * p.sin(angle) ) ;
  p.fill( Math.floor(p.random(256)) , Math.floor(p.random(256)) , Math.floor(p.random(256)) ) ;
  p.ellipse( 0 , 0 , r*ratio*2 , r*ratio*2 ) ;
  r = r*ratio ;
}
p.pop()