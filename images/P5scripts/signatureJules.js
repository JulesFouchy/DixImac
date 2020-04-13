push()
const ratio = 4.0 / 5.0 ;
noStroke() ;
fill( Math.floor(random(256)) , Math.floor(random(256)) , Math.floor(random(256)) , 100 ) ;
translate(width/2 , height/2) ;
let r = width/2 ;
ellipse( 0 , 0 , r*2 , r*2 ) ;
for( let k = 3 ; k < 20 ; ++k ){
  let angle = random(TAU) ;
  translate( r*(1-ratio) * cos(angle) , r*(1-ratio) * sin(angle) ) ;
  fill( Math.floor(random(256)) , Math.floor(random(256)) , Math.floor(random(256)) ) ;
  ellipse( 0 , 0 , r*ratio*2 , r*ratio*2 ) ;
  r = r*ratio ;
}
pop()