function pen20() {
  document.getElementById("text1").style.display = "block";
  document.getElementById("post").style.display = "block";
}

function cont20() {
  document.getElementById("container2").style.display = "block";
  document.getElementById("text1").style.display = "none";
  document.getElementById("post").style.display = "none";
  document.getElementById("num30").style.display = "none";
}

function uturn() {
  document.getElementById("container2").style.display = "none";
}

var count = 0;

var b = document.getElementById("list1");
let val = document.getElementById("text1").value;
let postit = document.getElementById("post");
postit.addEventListener("click", function () {
  count++;
  document.getElementById("num30").style.display = "block";
  document.getElementById("num30").innerHTML = count;

  var textbox = document.getElementById("text1").value;
  var li = document.createElement("li");
  var keypress = document.getElementById("text1");

  li.addEventListener("dblclick", function () {
    this.style.display = "none";
    // let p = count++ - 1;
    document.getElementById("num30").innerHTML = count;
  });
  li.style.marginTop = "20px";
  li.style.fontSize = "20px";
  li.style.paddingLeft = "10px";
  li.style.overflow = "hidden";
  li.style.paddingTop = "2px";
  li.style.overflowWrap = "break-word";
  li.style.cursor = "pointer";
  li.style.width = "500px";
  li.style.Height = "200px";
  li.style.backgroundColor = "blue";
  li.style.borderRadius = "5px";
  var text = document.createTextNode(textbox);

  li.appendChild(text);

  document.getElementById("list1").appendChild(li);

  document.getElementById("text1").value = "";
  document.getElementById("text1").style.display = "none";
  document.getElementById("post").style.display = "none";
  // b.append(space);
});
var keypress = document.getElementById("text1");
keypress.addEventListener("keypress", function (event) {
  if (event.key == "Enter") {
    event.preventDefault();
    document.getElementById("post").click();
  }
});

// the game

function go() {
  const one = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  ];
  const form = one.sort((a, b) => 0.2 - Math.random());
  let count = 0;
  // const err = document.getElementById("guess-box").value;

  document.getElementById("result20").innerHTML = form[1];
  let m = document.getElementById("guess-box").value;
  if (m != form[1]) {
    document.getElementById("two").style.opacity = 1;
    document.getElementById("result20").style.backgroundColor = "red";
  } else {
    document.getElementById("one").style.opacity = 1;
    document.getElementById("result20").style.backgroundColor = "green";
    document.getElementById("four").innerHTML = 500;
    document.getElementById("guess-box").style.display = "none";
    document.getElementById("btn23").style.display = "none";
    document.getElementById("uguess").style.display = "none";
    document.getElementById("audio").play();
  }
  document.getElementById("guess-box").value = "";
  // if (document.getElementById("guess-box").value == "") {
  //   document.getElementById("result20").innerHTML = "";
  // } else {
  //   document.getElementById("result20").innerHTML = form[1];
  // }
}

function dismiss() {
  document.getElementById("result20").style.backgroundColor = "grey";

  document.getElementById("result20").innerHTML = "";
}

var press = document.getElementById("guess-box");
press.addEventListener("keypress", function (event) {
  if (event.key == "Enter") {
    event.preventDefault();

    document.getElementById("btn23").click();
    document.getElementById("guess-box").value = "";
    document.getElementById("guess-box").innerHTML = "";
  }
});

// reload

function reload() {
  window.location.reload();
}

// timer
var timer = 10;
function start_playing() {
  setInterval(function () {
    document.getElementById("set").innerHTML = timer;
    timer--;
    if (timer == 0) {
      document.getElementById("set").innerHTML =
        "Game Over!";
       clearInterval(timer);
      
    }
  }, 1000);
}

