import saveAs from "file-saver";
import mergeImages from "merge-images";
// @ts-ignore
import Plotly from "plotly.js-gl2d-dist-min";
import { Dispatch, useRef, useState } from "react";
import Countdown from "react-countdown";
import { toast } from "react-toastify";
import { Word } from "../guesses/guesses.model";
import { getPuzzleName } from "../puzzle/puzzle.component";
import { PuzzleType } from "../puzzle/puzzle.model";

function Solved({
  guesses,
  puzzleType,
  currentPuzzle,
  plotData,
  defaultLayout,
  secret,
  setPlotData,
  puzzleSolved,
  isArchivePuzzle,
  nextPuzzleTime,
}: {
  guesses: Word[];
  puzzleType: PuzzleType;
  currentPuzzle: string;
  plotData: Plotly.Data[];
  defaultLayout: any;
  secret: Word | undefined;
  setPlotData: Dispatch<React.SetStateAction<Plotly.Data[]>>;
  puzzleSolved: boolean;
  isArchivePuzzle: boolean;
  nextPuzzleTime: Date;
}) {
  const [downloadingImage, setDownloadingImage] = useState(false);
  const [socialImage, setSocialImage] = useState("");
  const [exploreMode, setExploreMode] = useState(false);
  const imageGenerationRef = useRef<Promise<string> | null>(null);

  function getHintCount() {
    return guesses.filter((guess) => guess.isHint).length;
  }

  function getSolvedText() {
    const hintCount = getHintCount();
    const hintText =
      hintCount === 0
        ? "no hints"
        : hintCount === 1
          ? "1 hint"
          : `${hintCount} hints`;
    const extraText = puzzleType === "semantle" ? "(on Pimantle) " : "";

    return `solved ${getPuzzleName(
      puzzleType,
      currentPuzzle
    )} ${extraText}with ${guesses.length} ${
      guesses.length === 1 ? "guess" : "guesses"
    } and ${hintText}!`;
  }

  async function generateImage(): Promise<string> {
    if (socialImage) return socialImage;
    if (imageGenerationRef.current) return imageGenerationRef.current;

    setDownloadingImage(true);
    toast("Generating your result image...");

    const generation = (async () => {
      try {
        await new Promise<void>((resolve) => window.setTimeout(resolve, 100));

        const backgroundFigure = await Plotly.newPlot(
          "hidden-plot",
          [plotData[0]],
          {
            ...defaultLayout,
            plot_bgcolor: "rgba(0,0,0,255)",
          }
        );
        const backgroundLayer = await Plotly.toImage(backgroundFigure, {
          format: "png",
          width: 1920,
          height: 1080,
        });

        const foregroundFigure = await Plotly.react(
          "hidden-plot",
          [plotData[1], plotData[2]],
          defaultLayout
        );
        const foregroundLayer = await Plotly.toImage(foregroundFigure, {
          format: "png",
          width: 1920,
          height: 1080,
        });

        return await mergeImages([backgroundLayer, foregroundLayer]);
      } catch (error) {
        console.error("Could not generate the victory image:", error);
        toast.error(
          "We couldn't generate the result image. You can still copy the text result."
        );
        throw error;
      } finally {
        try {
          Plotly.purge("hidden-plot");
        } catch (cleanupError) {
          console.warn("Could not clean up the result image plot:", cleanupError);
        }
      }
    })();

    imageGenerationRef.current = generation;
    try {
      const image = await generation;
      setSocialImage(image);
      return image;
    } finally {
      imageGenerationRef.current = null;
      setDownloadingImage(false);
    }
  }

  async function getImageBlob(): Promise<Blob> {
    const image = await generateImage();
    const response = await fetch(image);
    if (!response.ok) {
      throw new Error(
        `Could not prepare the result image (HTTP ${response.status}).`
      );
    }
    return response.blob();
  }

  function downloadVictory() {
    if (downloadingImage) return;

    getImageBlob()
      .then((blob) => {
        saveAs(blob, `${puzzleType}-${currentPuzzle}.png`);
      })
      .catch(() => {
        toast.error("The result image could not be downloaded.");
      });
  }

  async function shareVictory(withImage: boolean) {
    if (typeof navigator.share !== "function") {
      toast.error("Sharing is not supported in this browser.");
      return;
    }

    const shareObject = {
      url: window.location.href,
      text: getShareString(),
    };

    try {
      if (withImage) {
        const blob = await getImageBlob();
        const file = new File([blob], `${puzzleType}-${currentPuzzle}.png`, {
          type: blob.type || "image/png",
        });

        if (
          typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [file] })
        ) {
          await navigator.share({ ...shareObject, files: [file] });
          return;
        }

        toast.info("Image sharing isn't supported here. Sharing the result text instead.");
      }

      await navigator.share(shareObject);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      toast.error(
        'Sorry, we couldn\'t share. Try using the "Copy" buttons instead.'
      );
    }
  }

  function getShareString() {
    return `I ${getSolvedText()}`;
  }

  async function copyVictory(withImage: boolean) {
    if (!navigator.clipboard) {
      toast.error("Copying is not supported in this browser.");
      return;
    }

    const shareText = getShareString() + "\n\n" + window.location.href;
    const textBlob = new Blob([shareText], { type: "text/plain" });

    try {
      if (withImage) {
        const imageBlob = await getImageBlob();
        if (
          typeof navigator.clipboard.write === "function" &&
          typeof ClipboardItem !== "undefined"
        ) {
          await navigator.clipboard.write([
            new ClipboardItem({
              [imageBlob.type || "image/png"]: imageBlob,
              [textBlob.type]: textBlob,
            }),
          ]);
          toast.success("Result image copied to clipboard!");
          return;
        }

        await navigator.clipboard.writeText(shareText);
        toast.info(
          "Result text copied. This browser doesn't support copying images."
        );
        return;
      }

      await navigator.clipboard.writeText(shareText);
      toast.success("Result copied to clipboard!");
    } catch (error) {
      console.error("Could not copy the result:", error);
      toast.error(
        "We couldn't copy the result. Check your browser clipboard permissions."
      );
    }
  }

  function explore() {
    setExploreMode(true);
    setPlotData((oldData) => [
      {
        ...oldData[0],
        hovertemplate:
          "<b>%{text}</b><br><br>Similarity: %{customdata[0]}<br>Rank: %{customdata[1]}<extra></extra>",
      },
      oldData[1],
      oldData[2],
    ]);
    toast.warn(
      "Explore mode enabled. You can now hover/tap on all nodes to see their similarity.\n\nWARNING: There are offensive words in the dataset, including slurs.",
      {
        autoClose: false,
        position: "top-center",
      }
    );
  }

  const canShareText = typeof navigator.share === "function";

  return (
    <div className="solved-container">
      <div
        className="congrats-text victory-banner guess-entry bg-correct"
        role="status"
        aria-live="polite"
      >
        <span>
          You did it! You {getSolvedText()} The secret word was{" "}
          <b className="victory-word">{secret?.word}</b>.
          {isArchivePuzzle ? (
            <> This archive puzzle is complete.</>
          ) : (
            <>
              {" "}Next daily puzzle in{" "}
              <span className="victory-countdown">
                <Countdown date={nextPuzzleTime} daysInHours={true} />
              </span>.
            </>
          )}
        </span>
      </div>

      <div
        className="reward-buttons"
        role="group"
        aria-label="Victory and sharing actions"
      >
        {canShareText && (
          <input
            onClick={() => shareVictory(false)}
            type="button"
            value="Share text"
          />
        )}
        {canShareText && (
          <input
            onClick={() => shareVictory(true)}
            disabled={downloadingImage}
            type="button"
            value="Share text + image"
          />
        )}
        <input
          onClick={() => copyVictory(false)}
          type="button"
          value="Copy text"
        />
        <input
          onClick={() => copyVictory(true)}
          disabled={downloadingImage}
          type="button"
          value="Copy image"
        />
        <input
          onClick={downloadVictory}
          disabled={downloadingImage}
          type="button"
          value="Download image"
        />
        {!exploreMode && (
          <input onClick={explore} type="button" value="Explore map" />
        )}
      </div>

      {downloadingImage && (
        <div className="downloading" role="status" aria-live="polite">
          Preparing your 1920 × 1080 result image…
        </div>
      )}
    </div>
  );
}

export default Solved;
