window.playSound = function(filePath) {
  const audio = document.getElementById("notif-sound");
  audio.src = filePath;
  audio.onloadedmetadata = () => {
    audio.play().catch(e => console.warn("Audio play failed:", e));
  };
};