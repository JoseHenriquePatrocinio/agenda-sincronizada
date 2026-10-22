window.IdleTimeout = {
    timer: null,
  
    init(timeout = 30 * 60 * 1000) {
      const resetTimer = () => {
        clearTimeout(this.timer);
  
        this.timer = setTimeout(() => {
          window.location.replace("/login.html");
        }, timeout);
      };
  
      [
        "mousemove",
        "mousedown",
        "keydown",
        "scroll",
        "touchstart"
      ].forEach((event) => {
        document.addEventListener(event, resetTimer, {
          passive: true,
        });
      });
  
      resetTimer();
    },
  };