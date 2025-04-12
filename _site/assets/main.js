document.addEventListener("alpine:init", () => {
  const Hls = window.Hls;

  function root() {
    this.$router.config({ mode: "hash", base: location.pathname });

    return {
      async init() {
        const radioData = await fetch("./assets/radio.json").then((res) =>
          res.json(),
        );
        this.$store.radioMap = { ...radioData };

        // init hash router
        if (location.hash === "") {
          this.$router.replace("/");
        }
      },
    };
  }

  function listen() {
    return {
      /** @type {any} */
      hlsInstance: undefined,

      isLoading: false,
      prevRadioName: "",

      /**
        @param {string} radioName
        @param {RadioMap} radioMap
       */
      onEffect(radioName, radioMap) {
        // wait for proper radio name and radio map
        if (!radioName || Object.keys(radioMap).length === 0) {
          return;
        }

        // if we already handled this route, do nothing
        if (radioName === this.prevRadioName) {
          return;
        }

        this.prevRadioName = radioName;
        this.initializePlayer(radioName, radioMap);
      },

      async init() {},

      /**
        @param {string} radioName
        @param {RadioMap} radioMap
       */
      initializePlayer(radioName, radioMap) {
        const activeRadio = Object.entries(radioMap).find(([name]) => {
          return name === radioName;
        });

        if (!activeRadio) {
          throw Error(`unable to find radio for ${radioName}`);
        }

        const playlistUrl = activeRadio[1];
        this.isLoading = true;

        /** @type {HTMLAudioElement} */
        const audioElem = this.$refs.player;

        if (!this.hlsInstance) {
          this.hlsInstance = new Hls({
            // debug: true,
          });

          this.hlsInstance.on(Hls.Events.MEDIA_ATTACHED, async () => {
            try {
              await audioElem.play();
            } catch (err) {
              // abort from switching radio stations are ok
              if (err.name === "AbortError") {
                return;
              }

              if (err.name === "NotAllowedError") {
                return;
              }

              throw Error(err);
            }
          });
        }

        if (this.hlsInstance && this.hlsInstance.media) {
          this.hlsInstance.detachMedia();
        }

        this.hlsInstance.loadSource(playlistUrl);
        this.hlsInstance.attachMedia(audioElem);
      },

      destroy() {
        if (this.hlsInstance) {
          this.hlsInstance.destroy();
        }
      },

      /** @param {Number} target */
      changeVolume(target) {
        this.$refs.player.volume = target;
      },
    };
  }

  window.Alpine.store("radioMap", {});
  window.Alpine.data("root", root);
  window.Alpine.data("listen", listen);
});
