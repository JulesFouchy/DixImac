  const EPSILON = 0.00001

  p.background(220)
  p.push()
  p.translate(p.width/2, p.height)
  p.scale(2.4, 2.4)
  p.translate(-p.width/2, -p.height)
  let x = p.width/2;
  let y = p.height ;
  //Body parameters
  let radiusFirstBall = 50 + p.random(-20,20) ;
  let ballDecreaseRatio = 0.7 ;
  let ballOffsetRatio = 0.5 ;
  let bodyColour = p.color( 190 , 224 , 221 ) ;
  //Hat parameters
  let topShapeHatBaseLengthRatio = 1 ;
  let topShapeHatWidthRatio = 0.6 ;
  let topShapeHatHeight = 0.7 ;
  let topShapeHatColour = p.color(p.int(p.random(256)),p.int(p.random(256)),p.int(p.random(256))) ;
  //Eyes parameters
  let eyesPositionRatioX = 0.35 ;
  let eyesPositionRatioY = 0.2 ;
  let drEyesRatio = 0.000115 ;
  let eyesStrokeWeightRatio = 0.005 ;
  //Nose parameters
  let noseBaseLengthRatio = 0.13 ;
  let noseLengthRatio = 0.33;
  let noseAngle = p.random(p.PI) ;      
  //Smile parameters
  let smileMinAngle = -p.TAU/8 + p.random(-p.TAU/16,p.TAU/16) ;
  let smileMaxAngle = p.TAU/8 + p.random(-p.TAU/16,p.TAU/16) ;
  let dSmileAngle = p.TAU/20 ;
  let smileRadiusRatio = 0.3 ;
  let smileEllipseDiameterRatio = 0.058 ;
  //Arms parameters
  let armsPositionRatioX = 0.35 ;
  let armsPositionRatioY = -0.3 ;
  let leftArmAngle = p.TAU/8 + p.random(-p.TAU/8,p.TAU/8) ;
  let rightArmAngle = p.TAU/8 + p.random(-p.TAU/8,p.TAU/8) ;
  let leftArmLengthRatio = p.random(0.85,0.9) ;
  let rightArmLengthRatio = p.random(0.85,0.9) ;
  let armsStrokeWeightRatio = 0.2 ;
  let minAngleHand = -p.TAU/4 ;
  let maxAngleHand = p.TAU/4 ;
  let nbFingers = 4 ;
  let fingerDistanceRatio = 0.1 ;
  let fingerRadiusRatio = 0.1 ;
  //Buttons parameters
  let buttonRadiusRatio = 0.1 ;
  let firstButtonPositionRatio = 0.3 ;
  let distanceButtonsRatio = 0.5 ;

    let startAngleRightEye = p.random(p.TAU) ;
  let startAngleLeftEye = p.random(p.TAU) ;
  let dStartAngleRightEye = p.TAU/60 + p.randomGaussian()*p.TAU/120 ;
  let dStartAngleLeftEye = p.TAU/60 + p.randomGaussian()*p.TAU/120 ;

  function rotateEyes(){
    startAngleRightEye += dStartAngleRightEye ;
    startAngleLeftEye += dStartAngleLeftEye ;
  }
  function spiral( x , y , startAngle ){
    p.strokeWeight(p.max(eyesStrokeWeightRatio*radiusFirstBall,0.5)) ;
    let r = 0 ;
    let theta = 0 ;
    let dtheta = p.TAU / 120 ;
    p.beginShape() ;
    while( theta < 3*p.TAU ){
      p.vertex( x+r*p.cos(startAngle+theta) , y+r*p.sin(startAngle+theta) ) ;
      r += drEyesRatio*radiusFirstBall ;
      theta += dtheta ;
    }
    p.endShape() ;
  }
  
  function arm( x , y , Length , angle ){
    p.strokeWeight( armsStrokeWeightRatio*radiusFirstBall ) ;
    p.stroke('#55290F') ;
    p.fill('#55290F') ;
    p.line( x , y , x + Length*p.cos(-angle) , y + Length*p.sin(-angle) ) ;
    p.push() ;
    p.translate( x + Length*p.cos(-angle) , y + Length*p.sin(-angle) ) ;
    p.rotate( - angle ) ;
    p.noStroke() ;
    let dagl = (maxAngleHand-minAngleHand)/(nbFingers-1) ;
    for( let agl = minAngleHand ; agl <= maxAngleHand+EPSILON ; agl+= dagl ){
      p.ellipse( fingerDistanceRatio*radiusFirstBall*p.cos(agl) , fingerDistanceRatio*radiusFirstBall*p.sin(agl) , fingerRadiusRatio*radiusFirstBall , fingerRadiusRatio*radiusFirstBall ) ;
    }
    p.pop() ;
  }
  
  function topShapeHat( x , y ){
    p.noStroke() ;
    p.fill( topShapeHatColour ) ;
    p.ellipse( x , y , radiusFirstBall*topShapeHatBaseLengthRatio , radiusFirstBall*topShapeHatBaseLengthRatio/2 ) ;
    p.rect( x - topShapeHatWidthRatio/2*radiusFirstBall , y - topShapeHatHeight*radiusFirstBall , topShapeHatWidthRatio*radiusFirstBall , topShapeHatHeight*radiusFirstBall ) ;
    p.ellipse( x , y - topShapeHatHeight*radiusFirstBall , topShapeHatWidthRatio*radiusFirstBall , topShapeHatHeight*radiusFirstBall/4 ) ;
  }
  
  let minAngleShift = -p.TAU/16 + p.random(-p.TAU/32,p.TAU/32) ;
  let maxAngleShift = p.TAU/16 + p.random(-p.TAU/32,p.TAU/32) ;
  let angleShift = 0 ;
  let dAngleShift = p.TAU/800 ;
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

  
    p.push() ;
    //Body
    let r = radiusFirstBall ;
    let yShift = -radiusFirstBall ;
    for( let k = 0 ; k < 3 ; ++k ){
      p.stroke(0) ;
      p.noStroke();
      p.strokeWeight(0.3) ;
      p.fill( 255 ) ; 
      p.ellipse( x , y+yShift , 2*r , 2*r ) ;
      if( k != 2 ){
        yShift -= r*ballOffsetRatio + r*ballDecreaseRatio ;
        r *= ballDecreaseRatio ;
      }
    }
    //Hat
    p.push() ;
    p.translate( x , y+yShift-r ) ;
    topShapeHat( 0 , 0 ) ;
    p.pop() ;
    //Eyes
    p.noFill() ;
    p.stroke(0) ;
    spiral( x - eyesPositionRatioX*r , y+yShift-eyesPositionRatioY*r , startAngleLeftEye ) ;
    spiral( x + eyesPositionRatioX*r , y+yShift-eyesPositionRatioY*r , startAngleRightEye ) ;
    //Smile
    p.push() ;
    p.translate( x , y + yShift ) ;
    p.fill(0) ;
    for( let agl = smileMinAngle+p.TAU/4 ; agl < smileMaxAngle+p.TAU/4 ; agl += dSmileAngle ){
      p.ellipse( smileRadiusRatio*radiusFirstBall*p.cos(agl) , smileRadiusRatio*radiusFirstBall*p.sin(agl) , smileEllipseDiameterRatio*radiusFirstBall , smileEllipseDiameterRatio*radiusFirstBall ) ;
    }
    p.pop() ;
    //Nose
    p.noStroke() ;
    p.fill( '#FA6000' ) ;
    p.push() ;
    p.translate( x , y + yShift ) ;
    p.rotate( noseAngle ) ;
    p.triangle( 0 , - noseBaseLengthRatio*radiusFirstBall/2 , 0 , noseBaseLengthRatio*radiusFirstBall/2 , noseLengthRatio*radiusFirstBall , 0 ) ;
    p.pop() ;
    //Arms
    arm( x - radiusFirstBall*armsPositionRatioX  , y - (2+ballDecreaseRatio+armsPositionRatioY)*radiusFirstBall , leftArmLengthRatio*radiusFirstBall , p.TAU/2-leftArmAngle+angleShift ) ;
    arm( x + radiusFirstBall*armsPositionRatioX  , y - (2+ballDecreaseRatio+armsPositionRatioY)*radiusFirstBall , rightArmLengthRatio*radiusFirstBall , rightArmAngle+angleShift ) ;
    //Buttons
    p.noStroke() ;
    p.fill( 0 ) ;
    let yButton = y-radiusFirstBall*(1+firstButtonPositionRatio) ;
    for( let k = 0 ; k < 3 ; ++k ){
      p.ellipse( x , yButton , buttonRadiusRatio*radiusFirstBall , buttonRadiusRatio*radiusFirstBall ) ;
      yButton -= distanceButtonsRatio*radiusFirstBall ;
    }
    p.pop() ;

p.pop()