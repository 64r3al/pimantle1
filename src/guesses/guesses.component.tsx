import {
  Dispatch,
  FormEvent,
  MutableRefObject,
  RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import {
  getPuzzleName,
  loadProgress,
  saveProgress,
} from "../puzzle/puzzle.component";
import { PuzzleType, SavedPuzzleProgress } from "../puzzle/puzzle.model";
import { SolveStatus } from "../SocketTypes";
import StatsPanel from "../stats/StatsPanel";
import WelcomePanel from "./WelcomePanel";
import { Word, SubmitGuessesParams } from "./guesses.model";
import GuessEntry from "./GuessEntry";
import Solved from "../solved/solved.component";
import { StatsStatus } from "../stats/stats.model";
// @ts-ignore
import Plotly from "plotly.js-gl2d-dist-min";

function Guesses({
  guesses,
  setGuesses,
  parsedWords,
  puzzleType,
  currentPuzzle,
  stats,
  socketState,
  socketGuessHandler,
  scroller,
  hoverEnabled,
  plotData,
  setPlotData,
  isArchivePuzzle,
  defaultLayout,
  secret,
  nextPuzzleTime,
  centerPlot,
}: {
  guesses: Word[];
  setGuesses: Dispatch<React.SetStateAction<Word[]>>;
  parsedWords: Word[];
  puzzleType: PuzzleType;
  currentPuzzle: string;
  stats: StatsStatus;
  socketState: string;
  socketGuessHandler: (
    x: number,
    y: number,
    solvedState: SolveStatus | undefined
  ) => void;
  scroller: RefObject<HTMLDivElement>;
  hoverEnabled: MutableRefObject<boolean>;
  plotData: Plotly.Data[];
  setPlotData: Dispatch<React.SetStateAction<Plotly.Data[]>>;
  isArchivePuzzle: boolean;
  defaultLayout: any;
  secret: Word | undefined;
  nextPuzzleTime: Date;
  centerPlot: (on?: Word | undefined) => void;
}) {
  let [mostRecentGuess, setMostRecentGuess] = useState<Word | undefined>(
    undefined
  );
  let [puzzleSolved, setPuzzleSolved] = useState<boolean>(false);
  let [displayByGuessIndex, setDisplayByGuessIndex] = useState<boolean>(false);
  const inputBox = useRef<HTMLFormElement>(null);
  const wordsByWord = useMemo(() => {
    const index = new Map<string, Word>();
    parsedWords.forEach((word) => index.set(word.word, word));
    return index;
  }, [parsedWords]);

  function saveGuesses(newGuessList: Word[]) {
    let savedState: SavedPuzzleProgress[] = newGuessList.map((word) => ({
      word: word.word,
      guessIndex: word.guessIndex ?? 0,
      isHint: word.isHint ?? false,
    }));

    savedState.sort((a, b) => (a.guessIndex || 0) - (b.guessIndex || 0));

    saveProgress(puzzleType, currentPuzzle, savedState);
  }

  function submitGuess(guess: FormEvent<HTMLFormElement>) {
    guess.preventDefault();
    let newGuess = guess.currentTarget.guess.value.toLowerCase().trim();
    if (!newGuess) {
      toast.info("Enter a word first.");
      return;
    }
    submitGuesses([{ word: newGuess, isHint: false }], false);
    guess.currentTarget.guess.value = "";
  }

  function getHint() {
    let firstHintIndex = guesses.length - 1;
    while (
      firstHintIndex > 0 &&
      guesses[firstHintIndex - 1].rank === guesses[firstHintIndex].rank + 1
    ) {
      firstHintIndex--;
    }
    let lowerHintRange = guesses[firstHintIndex].rank;
    let hintGoal = lowerHintRange;
    if (firstHintIndex !== 0) {
      hintGoal = Math.floor(
        (lowerHintRange + guesses[firstHintIndex - 1].rank) / 2
      );
    }

    submitHint(hintGoal);
  }

  function getGoodHint() {
    let bestGuess = guesses[guesses.length - 1];
    if (bestGuess.rank === 1) {
      toast.error("Sorry, you've already got the best hint!");
      return;
    }

    let hintGoal = Math.ceil(bestGuess.rank / 2);
    submitHint(hintGoal);
  }

  function submitHint(hintGoal: number) {
    // Parsed puzzle records are stored in rank order, so rank is the array index.
    let hintWord = parsedWords[hintGoal];
    if (hintWord) {
      submitGuesses(
        [
          {
            word: hintWord.word,
            isHint: true,
          },
        ],
        true
      );
    } else {
      toast.error("Sorry, we couldn't find a hint (somehow...).");
    }
  }

  function checkGuess(guess: string): Word | undefined {
    return wordsByWord.get(guess);
  }

  function submitGuesses(guess: SubmitGuessesParams[], isAutomated: boolean) {
    let isBulk = guess.length > 1;
    let newGuessObjects: Word[] = guess
      .map((guess) => {
        let result = checkGuess(guess.word);
        if (result === undefined) {
          toast.error(`I don't know the word "${guess.word}".`);
          inputBox.current?.animate(
            [
              { transform: "translateX(0px)" },
              { transform: "translateX(10px)" },
              { transform: "translateX(-10px)" },
              { transform: "translateX(10px)" },
              { transform: "translateX(-10px)" },
              { transform: "translateX(10px)" },
              { transform: "translateX(0px)" },
            ],
            {
              duration: 500,
            }
          );
        }
        return (
          result &&
          ({
            ...(result as Word),
            guessIndex: guess.index,
            isHint: guess.isHint,
            isBulk: isBulk,
          } as Word)
        );
      })
      .filter(
        (result: Word | undefined): result is Word => result !== undefined
      )
      .map((guess: Word, index: number) => {
        let previousGuess = guesses.find(
          (oldGuess) => oldGuess.word === guess.word
        );
        if (previousGuess) {
          setMostRecentGuess(previousGuess);
          centerPlot(previousGuess);
          return undefined;
        } else {
          return {
            ...(guess as Word),
            guessIndex: guess.guessIndex || guesses.length + index + 1,
          } as Word;
        }
      })
      .filter(
        (result: Word | undefined): result is Word => result !== undefined
      );

    let guessCount = guesses.length;
    if (newGuessObjects.length > 0) {
      guessCount += newGuessObjects.length;
      setGuesses((old) => {
        let newGuessList = [...old, ...newGuessObjects].sort(
          (a, b) => b.rank - a.rank
        );
        saveGuesses(newGuessList);
        return newGuessList;
      });

      let bestGuess = newGuessObjects[newGuessObjects.length - 1];
      setMostRecentGuess(bestGuess);
      centerPlot(bestGuess);

      setPlotData((prevState) => [
        prevState[0],
        prevState[1],
        {
          ...prevState[2],
          x: [...prevState[2].x, ...newGuessObjects.map((guess) => guess.x)],
          y: [...prevState[2].y, ...newGuessObjects.map((guess) => guess.y)],
          customdata: [
            ...prevState[2].customdata,
            ...newGuessObjects.map((guess) => [
              guess.similarity.toFixed(2),
              guess.rank,
              guess.guessIndex,
            ]),
          ],
          text: [
            ...prevState[2].text,
            ...newGuessObjects.map((guess) => guess.word),
          ],
          marker: {
            ...prevState[2].marker,
            color: [
              ...prevState[2].marker.color,
              ...newGuessObjects.map((guess) =>
                guess.isHint ? "lime" : guess.rank
              ),
            ],
          },
        },
      ]);

      let puzzleJustSolved = false;

      if (newGuessObjects.some((guess) => guess.rank === 0)) {
        const savePuzzleSolved = () => {
          try {
            localStorage.setItem(
              `${puzzleType}-${currentPuzzle}-solved`,
              JSON.stringify(new Date().toISOString())
            );
          } catch (error) {
            toast.error("Error saving puzzle completion");
          }
        };

        if (navigator.storage && navigator.storage.persist) {
          navigator.storage.persist().then(savePuzzleSolved).catch(savePuzzleSolved);
        } else {
          savePuzzleSolved();
        }

        setPuzzleSolved(true);
        puzzleJustSolved = true;
      }

      if (!isAutomated && newGuessObjects.length) {
        socketGuessHandler(
          newGuessObjects[0].x,
          newGuessObjects[0].y,
          puzzleJustSolved
            ? {
                guessesUsed: guessCount,
                hintsUsed: guesses.filter((guess) => guess.isHint).length,
              }
            : undefined
        );
      }
    }
  }

  const submitGuessesRef = useRef(submitGuesses);
  submitGuessesRef.current = submitGuesses;

  const centerPlotRef = useRef(centerPlot);
  centerPlotRef.current = centerPlot;

  const progressLoadKey = useRef<string | null>(null);

  function toggleSortOrder() {
    setDisplayByGuessIndex(!displayByGuessIndex);
  }

  function sortFunction() {
    if (displayByGuessIndex) {
      return (a: Word, b: Word) => (b.guessIndex || 0) - (a.guessIndex || 0);
    } else {
      return (a: Word, b: Word) => a.rank - b.rank;
    }
  }

  useEffect(() => {
    const enableHover = () => {
      hoverEnabled.current = true;
    };

    let hoverTimeout: number | undefined;
    const delayedEnableHover = () => {
      window.clearTimeout(hoverTimeout);
      hoverTimeout = window.setTimeout(enableHover, 100);
    };

    const handleResize = () => {
      centerPlotRef.current();
      if (scroller.current) {
        scroller.current.scrollTo({
          top: scroller.current.scrollHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousedown", enableHover);
    window.addEventListener("wheel", enableHover);
    window.addEventListener("touchstart", delayedEnableHover);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousedown", enableHover);
      window.removeEventListener("wheel", enableHover);
      window.removeEventListener("touchstart", delayedEnableHover);
      window.clearTimeout(hoverTimeout);
    };
  }, [hoverEnabled, scroller]);

  useEffect(() => {
    if (parsedWords.length === 0) {
      return;
    }

    const puzzleKey = `${puzzleType}-${currentPuzzle}`;
    if (progressLoadKey.current === puzzleKey) {
      return;
    }
    progressLoadKey.current = puzzleKey;

    loadProgress(puzzleType, currentPuzzle)
      .then((storedProgressList) => {
        if (storedProgressList) {
          submitGuessesRef.current(
            storedProgressList.map((guess: SavedPuzzleProgress) => ({
              word: guess.word,
              index: guess.guessIndex,
              isHint: guess.isHint,
            })),
            true
          );
        }
      })
      .catch(() => {
        toast.error("Error loading saved progress");
      });
  }, [parsedWords, puzzleType, currentPuzzle]);

  useEffect(() => {
    scroller.current?.scrollTo({
      top: scroller.current.scrollHeight,
    });
    hoverEnabled.current = false;

    const hoverTimeout = window.setTimeout(() => {
      if (mostRecentGuess) {
        // @ts-ignore
        Plotly.Fx.hover("plot-div", [
          {
            curveNumber: 2,
            pointNumber: Math.max((mostRecentGuess.guessIndex || 0) - 1, 0),
          },
        ]);
      }
    }, 100);

    return () => {
      window.clearTimeout(hoverTimeout);
    };
  }, [mostRecentGuess, hoverEnabled, scroller]);

  return (
    <div className="guess-container">
      <div className="guess-list" ref={scroller}>
        {mostRecentGuess && (
          <>
            {puzzleSolved || (
              <div>
                <hr />
                <GuessEntry guess={mostRecentGuess} />
              </div>
            )}
            {[...guesses].sort(sortFunction()).map((guess) => (
              <GuessEntry
                guess={guess}
                animated={true}
                key={`first-guess-${guess.word}`}
              />
            ))}
          </>
        )}

        {
          <>
            <div className={`guess-setting bg-frigid`}>
              <label htmlFor="toggleSort">Sort guesses chronologically</label>
              <input
                id="toggleSort"
                type="checkbox"
                checked={displayByGuessIndex}
                onClick={toggleSortOrder}
              />
              <label className="switch-label" htmlFor="toggleSort">
                <span className="switch-button" />
              </label>
            </div>
          </>
        }

        {socketState === "connected" && (
          <StatsPanel
            puzzleName={getPuzzleName(puzzleType, currentPuzzle)}
            stats={stats}
          />
        )}

        <WelcomePanel isArchivePuzzle={isArchivePuzzle} />
      </div>
      {puzzleSolved || (
        <form onSubmit={submitGuess} className="guess-form" ref={inputBox}>
          <input
            type="text"
            placeholder="Enter a guess"
            id="guess"
            className="guess-input"
            autoCapitalize="none"
            autoComplete="off"
            autoFocus={true}
          />
          <input type="submit" value="Guess" className="guess-submit" />
          {guesses.length > 10 && (
            <input
              type="button"
              value="Hint"
              className="hint-button"
              onClick={getHint}
            />
          )}
          {guesses.filter((g) => g.isHint).length > 6 &&
            !guesses.some((guess) => guess.rank === 1) && (
              <input
                type="button"
                value="Good hint"
                className="give-up-button"
                onClick={getGoodHint}
              />
            )}
        </form>
      )}
      {puzzleSolved && (
        <Solved
          guesses={guesses}
          puzzleType={puzzleType}
          currentPuzzle={currentPuzzle}
          plotData={plotData}
          defaultLayout={defaultLayout}
          secret={secret}
          setPlotData={setPlotData}
          puzzleSolved={puzzleSolved}
          nextPuzzleTime={nextPuzzleTime}
        />
      )}
    </div>
  );
}

export default Guesses;
