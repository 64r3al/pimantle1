import saveAs from "file-saver";
import mergeImages from "merge-images";
// @ts-ignore
import Plotly from "plotly.js-gl2d-dist-min";
import { Dispatch, useState } from "react";
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
  nextPuzzleTime: Date;
}) {
  let [downloadingImage, setDownloadingImage] = useState<boolean>(false);
  let [socialImage, setSocialImage] = useState<string>("");
  let [exploreMode, setExploreMode] = useState<boolean>(false);
  function getSolvedText() {
    let hintCount = getHintCount();
    let hintText = "";
    if (hintCount === 0) {
      hintText = "no hints";
    } else if (hintCount === 1) {
      hintText = "1 hint";
    } else {
      hintText = `${hintCount} hints`;
    }

    let extraText = puzzleType === "semantle" ? "(on Pimantle) " : "";
    return `solved ${getPuzzleName(
      puzzleType,
      currentPuzzle
    )} ${extraText}with ${guesses.length} ${
      guesses.length > 1 ? "guesses" : "guess"
    } and ${hintText}!`;
  }

  function getHintCount() {
    return guesses.filter((guess) => guess.isHint).length;
  }

  async function generateImage(): Promise<string> {
    if (socialImage !== "") {
      return socialImage;
    }

    setDownloadingImage(true);
    toast("Generating your result image...");

    try {
      // Allow the hidden Plotly container to settle before rendering.
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

      const mergedImage = await mergeImages([
        backgroundLayer,
        foregroundLayer,
      ]);
      setSocialImage(mergedImage);
      return mergedImage;
    } catch (error) {
      console.error("Could not generate the victory image:", error);
      toast.error("We couldn't generate the result image. You can still copy the text result.");
      throw error;
    } finally {
      Plotly.purge("hidden-plot");
      setDownloadingImage(false);
    }
  }

  async function getImageBlob(): Promise<Blob> {
    const image = await generateImage();
    const response = await fetch(image);
    if (!response.ok) {
      throw new Error(`Could not prepare the result image (HTTP ${response.status}).`);
    }
    return response.blob();
  }

  function downloadVictory() {
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
      }

      await navigator.share(shareObject);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      toast.error('Sorry, we couldn\'t share. Try using the "Copy" buttons instead.');
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
        toast.info("Result text copied. This browser doesn't support copying images.");
        return;
      }

      await navigator.clipboard.writeText(shareText);
      toast.success("Result copied to clipboard!");
    } catch (error) {
      console.error("Could not copy the result:", error);
      toast.error("We couldn't copy the result. Check your browser clipboard permissions.");
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

  return (
    <div className="solved-container">
      <div className="congrats-text guess-entry bg-correct">
        <span>
          You did it! You {getSolvedText()} The secret word was{" "}
          <b>{secret?.word}</b>. New puzzle in{" "}
          <Countdown date={nextPuzzleTime} daysInHours={true} />.
        </span>
      </div>
      <div className="reward-buttons">
        {typeof navigator.canShare !== "undefined" &&
          navigator.canShare({ text: "test" }) && (
            <div>
              <input
                onClick={() => shareVictory(false)}
                type="button"
                value="Share (text)"
              />
              <input
                onClick={() => shareVictory(true)}
                disabled={downloadingImage}
                type="button"
                value="Share (text+image)"
              />
            </div>
          )}

        <input
          onClick={() => copyVictory(false)}
          type="button"
          value="Copy (text)"
        />
        <input
          onClick={() => copyVictory(true)}
          type="button"
          value="Copy (image)"
        />
        <input
          onClick={() => downloadVictory()}
          disabled={downloadingImage}
          type="button"
          value="Download"
        />
        {exploreMode || (
          <input onClick={() => explore()} type="button" value="Explore" />
        )}
      </div>
      {downloadingImage && (
        <div className="downloading">Just a sec, generating image...</div>
      )}
    </div>
  );
}

export default Solved;
