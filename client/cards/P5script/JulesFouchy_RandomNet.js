const gaussian = x => exp(-x*x/2)

const myRandomGaussian = (maxVal) => {
  const maxY = gaussian(0)
  let x = random(-maxVal, maxVal)
  let y = random(maxY)
  while (y > gaussian(x)) {
      x = random(-maxVal, maxVal)
      y = random(maxY)
  }
  return x
}

const randomPt = () => {
  let r = myRandomGaussian(0.5/0.4) * width * 0.4
  // while (abs(r) > 0.5*width) {
  //   r = myRandomGaussian(3) * width * 0.4
  // }
  const a = random(TAU)
  
  return p5.Vector.fromAngle(a).mult(r)
}

const yesOrNo = () => {
  return random() < 0.6
}

const getClosestIndex = (ptsList, pt) => {
  let dist = Infinity
  let index = -1
  ptsList.forEach((opt, i) => {
    const d = sqrt(sq(pt.x-opt.x) + sq(pt.y-opt.y))
    if (d < dist) {
      dist = d
      index = i
    }
  })
  return index
}

  background(0)
  
  for (let i = 0; i < 18; ++i ){
    let x = random(width)
    let y = random(height)
    let r = width * random(0.15, 0.35)
    noStroke()
    fill(random(50, 200), random(50, 200))
    ellipse(x, y, r)
  }
  
  stroke(235, 50, 20)
  strokeWeight(2)
  
  translate(width / 2, height / 2)
  
  for (let i = 0; i < 3 ; ++i) {
    const t = i / 3
    background(100, 100, 200, 80)
    const col = lerpColor(color(245, 59, 40), color(255, 200, 100), 1-t)
    fill(col)
    const ptsList = []
    for (let i = 0; i < 10; ++i) {
      ptsList.push(randomPt())
    }

    ptsList.forEach( pt => {
      ellipse(pt.x, pt.y, 15)
    })

    let pt = ptsList[0]
    const firstPt = createVector(pt.x, pt.y)
    ptsList.splice(0, 1);
    let bMustLink = true
    while (ptsList.length > 0) {
      let nextPtIndex = getClosestIndex(ptsList, pt)
      const nextPt = ptsList[nextPtIndex]
      if (bMustLink || yesOrNo()) {
        line(pt.x, pt.y, nextPt.x, nextPt.y)
        bMustLink = false
      }
      else {
        bMustLink = true
      }

      pt.set(nextPt)
      ptsList.splice(nextPtIndex, 1);
    }
    line(pt.x, pt.y, firstPt.x, firstPt.y)
  }