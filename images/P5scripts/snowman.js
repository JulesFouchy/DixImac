  const EPSILON = 0.00001

  push()
  translate(width/2, height)
  scale(2.4, 2.4)
  translate(-width/2, -height)
  let x = width/2;
  let y = height ;
  //Body parameters
  let radiusFirstBall = 50 + random(-20,20) ;
  let ballDecreaseRatio = 0.7 ;
  let ballOffsetRatio = 0.5 ;
  let bodyColour = color( 190 , 224 , 221 ) ;
  //Hat parameters
  let topShapeHatBaseLengthRatio = 1 ;
  let topShapeHatWidthRatio = 0.6 ;
  let topShapeHatHeight = 0.7 ;
  let topShapeHatColour = color(int(random(256)),int(random(256)),int(random(256))) ;
  //Eyes parameters
  let eyesPositionRatioX = 0.35 ;
  let eyesPositionRatioY = 0.2 ;
  let drEyesRatio = 0.000115 ;
  let eyesStrokeWeightRatio = 0.005 ;
  //Nose parameters
  let noseBaseLengthRatio = 0.13 ;
  let noseLengthRatio = 0.33;
  let noseAngle = random(PI) ;      
  //Smile parameters
  let smileMinAngle = -TAU/8 + random(-TAU/16,TAU/16) ;
  let smileMaxAngle = TAU/8 + random(-TAU/16,TAU/16) ;
  let dSmileAngle = TAU/20 ;
  let smileRadiusRatio = 0.3 ;
  let smileEllipseDiameterRatio = 0.058 ;
  //Arms parameters
  let armsPositionRatioX = 0.35 ;
  let armsPositionRatioY = -0.3 ;
  let leftArmAngle = TAU/8 + random(-TAU/8,TAU/8) ;
  let rightArmAngle = TAU/8 + random(-TAU/8,TAU/8) ;
  let leftArmLengthRatio = random(0.85,0.9) ;
  let rightArmLengthRatio = random(0.85,0.9) ;
  let armsStrokeWeightRatio = 0.2 ;
  let minAngleHand = -TAU/4 ;
  let maxAngleHand = TAU/4 ;
  let nbFingers = 4 ;
  let fingerDistanceRatio = 0.1 ;
  let fingerRadiusRatio = 0.1 ;
	//Buttons parameters
	let buttonRadiusRatio = 0.1 ;
	let firstButtonPositionRatio = 0.3 ;
	let distanceButtonsRatio = 0.5 ;

    let startAngleRightEye = random(TAU) ;
  let startAngleLeftEye = random(TAU) ;
  let dStartAngleRightEye = TAU/60 + randomGaussian()*TAU/120 ;
  let dStartAngleLeftEye = TAU/60 + randomGaussian()*TAU/120 ;

  function rotateEyes(){
    startAngleRightEye += dStartAngleRightEye ;
    startAngleLeftEye += dStartAngleLeftEye ;
  }
  function spiral( x , y , startAngle ){
    strokeWeight(max(eyesStrokeWeightRatio*radiusFirstBall,0.5)) ;
    let r = 0 ;
    let theta = 0 ;
    let dtheta = TAU / 120 ;
    beginShape() ;
    while( theta < 3*TAU ){
      vertex( x+r*cos(startAngle+theta) , y+r*sin(startAngle+theta) ) ;
      r += drEyesRatio*radiusFirstBall ;
      theta += dtheta ;
    }
    endShape() ;
  }
  
  function arm( x , y , Length , angle ){
    strokeWeight( armsStrokeWeightRatio*radiusFirstBall ) ;
    stroke('#55290F') ;
    fill('#55290F') ;
    line( x , y , x + Length*cos(-angle) , y + Length*sin(-angle) ) ;
    push() ;
    translate( x + Length*cos(-angle) , y + Length*sin(-angle) ) ;
    rotate( - angle ) ;
    noStroke() ;
    let dagl = (maxAngleHand-minAngleHand)/(nbFingers-1) ;
    for( let agl = minAngleHand ; agl <= maxAngleHand+EPSILON ; agl+= dagl ){
      ellipse( fingerDistanceRatio*radiusFirstBall*cos(agl) , fingerDistanceRatio*radiusFirstBall*sin(agl) , fingerRadiusRatio*radiusFirstBall , fingerRadiusRatio*radiusFirstBall ) ;
    }
    pop() ;
  }
  
  function topShapeHat( x , y ){
    noStroke() ;
    fill( topShapeHatColour ) ;
    ellipse( x , y , radiusFirstBall*topShapeHatBaseLengthRatio , radiusFirstBall*topShapeHatBaseLengthRatio/2 ) ;
    rect( x - topShapeHatWidthRatio/2*radiusFirstBall , y - topShapeHatHeight*radiusFirstBall , topShapeHatWidthRatio*radiusFirstBall , topShapeHatHeight*radiusFirstBall ) ;
    ellipse( x , y - topShapeHatHeight*radiusFirstBall , topShapeHatWidthRatio*radiusFirstBall , topShapeHatHeight*radiusFirstBall/4 ) ;
  }
  
  let minAngleShift = -TAU/16 + random(-TAU/32,TAU/32) ;
  let maxAngleShift = TAU/16 + random(-TAU/32,TAU/32) ;
  let angleShift = 0 ;
  let dAngleShift = TAU/800 ;
  function moveArms(){
    if( dAngleShift > 0 ){
      angleShift += dAngleShift ;
      if( angleShift >= maxAngleShift ){
        dAngleShift = -dAngleShift ;
        angleShift += dAngleShift ;
      }
    }
    else{
      angleShift += dAngleShift ;
      if( angleShift <= minAngleShift ){
        dAngleShift = -dAngleShift ;
        angleShift += dAngleShift ;
      }
    }
  }

  
    push() ;
    //Body
    let r = radiusFirstBall ;
    let yShift = -radiusFirstBall ;
    for( let k = 0 ; k < 3 ; ++k ){
      stroke(0) ;
      noStroke();
      strokeWeight(0.3) ;
      fill( 255 ) ; 
      ellipse( x , y+yShift , 2*r , 2*r ) ;
      if( k != 2 ){
        yShift -= r*ballOffsetRatio + r*ballDecreaseRatio ;
        r *= ballDecreaseRatio ;
      }
    }
    //Hat
    push() ;
    translate( x , y+yShift-r ) ;
    topShapeHat( 0 , 0 ) ;
    pop() ;
    //Eyes
    noFill() ;
    stroke(0) ;
    spiral( x - eyesPositionRatioX*r , y+yShift-eyesPositionRatioY*r , startAngleLeftEye ) ;
    spiral( x + eyesPositionRatioX*r , y+yShift-eyesPositionRatioY*r , startAngleRightEye ) ;
    //Smile
    push() ;
    translate( x , y + yShift ) ;
    fill(0) ;
    for( let agl = smileMinAngle+TAU/4 ; agl < smileMaxAngle+TAU/4 ; agl += dSmileAngle ){
      ellipse( smileRadiusRatio*radiusFirstBall*cos(agl) , smileRadiusRatio*radiusFirstBall*sin(agl) , smileEllipseDiameterRatio*radiusFirstBall , smileEllipseDiameterRatio*radiusFirstBall ) ;
    }
    pop() ;
    //Nose
    noStroke() ;
    fill( '#FA6000' ) ;
    push() ;
    translate( x , y + yShift ) ;
    rotate( noseAngle ) ;
    triangle( 0 , - noseBaseLengthRatio*radiusFirstBall/2 , 0 , noseBaseLengthRatio*radiusFirstBall/2 , noseLengthRatio*radiusFirstBall , 0 ) ;
    pop() ;
    //Arms
    arm( x - radiusFirstBall*armsPositionRatioX  , y - (2+ballDecreaseRatio+armsPositionRatioY)*radiusFirstBall , leftArmLengthRatio*radiusFirstBall , TAU/2-leftArmAngle+angleShift ) ;
    arm( x + radiusFirstBall*armsPositionRatioX  , y - (2+ballDecreaseRatio+armsPositionRatioY)*radiusFirstBall , rightArmLengthRatio*radiusFirstBall , rightArmAngle+angleShift ) ;
		//Buttons
		noStroke() ;
		fill( 0 ) ;
		let yButton = y-radiusFirstBall*(1+firstButtonPositionRatio) ;
		for( let k = 0 ; k < 3 ; ++k ){
			ellipse( x , yButton , buttonRadiusRatio*radiusFirstBall , buttonRadiusRatio*radiusFirstBall ) ;
			yButton -= distanceButtonsRatio*radiusFirstBall ;
		}
		pop() ;

pop()