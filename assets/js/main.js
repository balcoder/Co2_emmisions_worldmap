console.log('test 1');
console.log('test 1.1');
const img1 = document.getElementById('foo');
const img = new Image();
img.src = "./img/hotel-1.jpg";
img.setAttribute('width', '50%');
img.setAttribute('height', '50%');
img1.appendChild(img);
