import { Flex } from "@chakra-ui/react";
import { Player } from "@livepeer/react";

const LivepeerPlayer = ({ playbackId }: { playbackId: string }) => {
  const showOverlay = () => {
    const overlay = document.getElementById("video-overlay");

    if (overlay) {
      overlay.style.animationName = "none";

      requestAnimationFrame(() => {
        setTimeout(() => {
          overlay.style.animationName = "";
        }, 0);
      });
    }
  };

  return (
    <Flex
      direction="column"
      width={"100%"}
      position="relative"
      onMouseMove={showOverlay}
      onTouchStart={showOverlay}
    >
      <Player
        playbackId={playbackId}
        aspectRatio="16to9"
        controls={{
          autohide: 3000,
        }}
        theme={{
          borderStyles: { containerBorderStyle: undefined },
          radii: { containerBorderRadius: "10px" },
        }}
      />
    </Flex>
  );
};

export default LivepeerPlayer;