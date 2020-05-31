const gaussian = x => p.exp(-x*x/2)

const myRandomGaussian = (maxVal) => {
  const maxY = gaussian(0)
  let x = p.random(-maxVal, maxVal)
  let y = p.random(maxY)
  while (y > gaussian(x)) {
      x = p.random(-maxVal, maxVal)
      y = p.random(maxY)
  }
  return x
}

const randomPt = () => {
  let r = myRandomGaussian(0.5/0.4) * p.width * 0.4
  // while (abs(r) > 0.5*width) {
  //   r = myRandomGaussian(3) * width * 0.4
  // }
  const a = p.random(p.TAU)
  
  return p5.Vector.fromAngle(a).mult(r)
}

const yesOrNo = () => {
  return p.random() < 0.6
}

const getClosestIndex = (ptsList, pt) => {
  let dist = Infinity
  let index = -1
  ptsList.forEach((opt, i) => {
    const d = p.sqrt(p.sq(pt.x-opt.x) + p.sq(pt.y-opt.y))
    if (d < dist) {
      dist = d
      index = i
    }
  })
  return index
}

  p.background(0)
  
  for (let i = 0; i < 18; ++i ){
    let x = p.random(p.width)
    let y = p.random(p.height)
    let r = p.width * p.random(0.15, 0.35)
    p.noStroke()
    p.fill(p.random(50, 200), p.random(50, 200))
    p.ellipse(x, y, r)
  }
  
  p.stroke(235, 50, 20)
  p.strokeWeight(2)
  
  p.translate(p.width / 2, p.height / 2)
  
  for (let i = 0; i < 3 ; ++i) {
    const t = i / 3
    p.background(100, 100, 200, 80)
    const col = p.lerpColor(p.color(245, 59, 40), p.color(255, 200, 100), 1-t)
    p.fill(col)
    const ptsList = []
    for (let i = 0; i < 10; ++i) {
      ptsList.push(randomPt())
    }

    ptsList.forEach( pt => {
      p.ellipse(pt.x, pt.y, 15)
    })

    let pt = ptsList[0]
    const firstPt = p.createVector(pt.x, pt.y)
    ptsList.splice(0, 1);
    let bMustLink = true
    while (ptsList.length > 0) {
      let nextPtIndex = getClosestIndex(ptsList, pt)
      const nextPt = ptsList[nextPtIndex]
      if (bMustLink || yesOrNo()) {
        p.line(pt.x, pt.y, nextPt.x, nextPt.y)
        bMustLink = false
      }
      else {
        bMustLink = true
      }

      pt.set(nextPt)
      ptsList.splice(nextPtIndex, 1);
    }
    p.line(pt.x, pt.y, firstPt.x, firstPt.y)
  }