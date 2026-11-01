import { useEffect, useRef, useState } from "react";
import "./App.css";
import wordList from "./data/word_list.json";
import puzzleAvailability from "./data/puzzle_availability.json";
import { getFloat16 } from "@petamoriken/float16";
import PlotContainer from "./plot/PlotContainer";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import dayjs from "dayjs";
import { ArchiveLink } from "./archive/ArchiveLink";
import MultiplayerBackground from "./MultiplayerBackground";
import { io, Socket } from "socket.io-client";
import {
  ClientEvent,
  LesserStatsUpdate,
  ServerEvent,
  SolveStatus,
  StatsUpdate,
} from "./SocketTypes";
import { Subject } from "rxjs";
import ArchiveDropdown from "./archive/ArchiveDropdown";
import SettingsDropdown from "./settings/SettingsDropdown";
import { Word } from "./guesses/guesses.model";
import { PuzzleType } from "./puzzle/puzzle.model";
import { loadProgress, migrateLocalStorage } from "./puzzle/puzzle.component";
import { StatsStatus } from "./stats/stats.model";
import Guesses from "./guesses/guesses.component";
// @ts-ignore
import Plotly from "plotly.js-gl2d-dist-min";
import ServerPanel from "./server/ServerPanel.component";

function App() {
  let [secret, setSecret] = useState<Word>();
  let [plotData, setPlotData] = useState<Plotly.Data[]>([]);
  let hoverEnabled = useRef<boolean>(true);
  let [displayedXRange, setDisplayedXRange] = useState<number[]>([-0.5, 0.5]);
  let [displayedYRange, setDisplayedYRange] = useState<number[]>([
    -0.28125, 0.28125,
  ]);
  const scroller = useRef<HTMLDivElement>(null);

  let [archiveOpen, setArchiveOpen] = useState<boolean>(false);
  let [isArchivePuzzle, setIsArchivePuzzle] = useState<boolean>(false);

  let [archivePimantles, setArchivePimantles] = useState<ArchiveLink[]>([]);
  let [archiveSemantles, setArchiveSemantles] = useState<ArchiveLink[]>([]);
  let [puzzleType, setPuzzleType] = useState<PuzzleType>("pimantle");
  let [currentPuzzle, setCurrentPuzzle] = useState<string>("?");
  let [parsedWords, setParsedWords] = useState<Word[]>([]);
  let [loadError, setLoadError] = useState<string | null>(null);
  let [guesses, setGuesses] = useState<Word[]>([]);
  let [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  let [socketGuessHandler, setSocketGuessHandler] = useState<
    (x: number, y: number, solvedState: SolveStatus | undefined) => void
  >(() => () => {});
  let [dataRevision, setDataRevision] = useState<number>(0);
  let [bizarreEdgeCaseThingIHateIt, setBizarreEdgeCaseThingIHateIt] =
    useState<number>(Math.random() / 10000 + 0.00001);

  let [nextPuzzleTime, setNextPuzzleTime] = useState<Date>(new Date());
  let [stats, setStats] = useState<StatsStatus>({
    totalGuesses: 0,
    totalSolves: 0,
    totalSolveGuesses: 0,
    buckets: [],
  });

  let defaultLayout = {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    margin: {
      l: 0,
      r: 0,
      b: 0,
      t: 0,
      pad: 500,
    },
    xaxis: {
      autorange: false,
      showgrid: false,
      showticklabels: false,
      zerolinecolor: "rgba(255,255,255,0.1)",
      range: [-0.5, 0.5],
    },
    yaxis: {
      autorange: false,
      showgrid: false,
      showticklabels: false,
      // scaleanchor: "x",
      constraintoward: "center",
      zerolinecolor: "rgba(255,255,255,0.1)",
      range: [-0.28125, 0.28125],
    },
    dragmode: "pan",
    showlegend: false,
    uirevision: 1,
  };

  let [socketState, setSocketState] = useState<
    "connected" | "connecting" | "closed"
  >("connecting");
  let [playersOnline, setPlayersOnline] = useState<number>(0);
  let [socketDisconnectCallback, setSocketDisconnectCallback] = useState<
    () => void
  >(() => {});
  let socketGuessObservable = useRef<Subject<{ x: number; y: number }>>(
    new Subject<{ x: number; y: number }>()
  );
  let [plotLayout, setPlotLayout] = useState<Plotly.Layout>(defaultLayout);

  function updateStats(stats: StatsUpdate | LesserStatsUpdate) {
    if (stats.type === "greater") {
      setStats({
        totalGuesses: stats.total_guesses,
        totalSolves: stats.total_solves,
        totalSolveGuesses: stats.total_guesses_for_solves,
        buckets: [
          stats.solve_bucket_1_20,
          stats.solve_bucket_21_40,
          stats.solve_bucket_41_60,
          stats.solve_bucket_61_80,
          stats.solve_bucket_81_100,
          stats.solve_bucket_101_120,
          stats.solve_bucket_121_140,
          stats.solve_bucket_141_160,
          stats.solve_bucket_161_180,
          stats.solve_bucket_181_200,
          stats.solve_bucket_201_220,
          stats.solve_bucket_221_240,
          stats.solve_bucket_241_260,
          stats.solve_bucket_261_280,
          stats.solve_bucket_281_300,
          stats.solve_bucket_301_320,
          stats.solve_bucket_321_340,
          stats.solve_bucket_341_360,
          stats.solve_bucket_361_380,
          stats.solve_bucket_381_400,
          stats.solve_bucket_401_420,
          stats.solve_bucket_421_440,
          stats.solve_bucket_441_460,
          stats.solve_bucket_461_480,
          stats.solve_bucket_481_500,
        ],
      });
    } else {
      setStats((old) => ({
        ...old,
        totalGuesses: stats.totalGuesses,
      }));
    }
  }

  useEffect(() => {
    let disposed = false;
    let activeSocket: Socket<ServerEvent, ClientEvent> | undefined;
    if (localStorage.getItem("pimantle-offline")) {
      setSocketState("closed");
    }
    // ReactGA.initialize("G-QXGCPQVS46");
    // ReactGA.pageview(window.location.pathname + window.location.search);
    (async () => {
      let pimantleEpoch = dayjs("2022-02-22T03:00:00");
      let semantleEpoch = dayjs("2022-01-29T00:00:00Z");
      let today = dayjs();

      let todaysPimantle = today.diff(pimantleEpoch, "days");
      let todaysSemantle = today.diff(semantleEpoch, "days");

      let pimantleArchive: ArchiveLink[] = [];
      let semantleArchive: ArchiveLink[] = [];

      await migrateLocalStorage();

      // Only expose archive entries for puzzle binaries included in this repository.
      const maxPimantleArchive = Math.min(
        todaysPimantle - 1,
        puzzleAvailability.pimantle.max
      );
      const maxSemantleArchive = Math.min(
        todaysSemantle - 1,
        puzzleAvailability.semantle.max
      );

      for (
        let i = Math.max(maxPimantleArchive, maxSemantleArchive);
        i >= 0;
        i--
      ) {
        if (i <= maxSemantleArchive) {
          let semantleProgress = await loadProgress("semantle", i);
          let semantleSolved = localStorage.getItem(`semantle-${i}-solved`);
          semantleArchive.push({
            puzzleType: "semantle",
            puzzleIndex: i,
            started: !!semantleProgress,
            solved: !!semantleSolved,
            guesses: (semantleProgress && semantleProgress.length) ?? 0,
          });
        }

        if (i <= maxPimantleArchive) {
          let pimantleProgress = await loadProgress("pimantle", i);
          let pimantleSolved = localStorage.getItem(`pimantle-${i}-solved`);
          pimantleArchive.push({
            puzzleType: "pimantle",
            puzzleIndex: i,
            started: !!pimantleProgress,
            solved: !!pimantleSolved,
            guesses: (pimantleProgress && pimantleProgress.length) ?? 0,
          });
        }
      }

      setArchivePimantles(pimantleArchive);
      setArchiveSemantles(semantleArchive);

      const urlParams = new URLSearchParams(window.location.search);
      const urlPuzzleType = urlParams.get("type");
      const urlPuzzleIndex = Number.parseInt(urlParams.get("puzzle") ?? "-1", 10);

      let selectedPuzzleType: PuzzleType = "pimantle";
      let newPuzzleNumber = Math.min(
        todaysPimantle,
        puzzleAvailability.pimantle.max
      );
      let selectedIsArchivePuzzle =
        todaysPimantle > puzzleAvailability.pimantle.max;
      let fallbackMessage: string | null = null;

      if (selectedIsArchivePuzzle) {
        fallbackMessage =
          `Today's Pimantle puzzle (#${todaysPimantle}) is not included in this repository snapshot. Opening the latest bundled archive puzzle (#${newPuzzleNumber}) instead.`;
      }

      if (
        Number.isInteger(urlPuzzleIndex) &&
        urlPuzzleIndex >= 0 &&
        urlPuzzleType?.startsWith("p")
      ) {
        selectedPuzzleType = "pimantle";
        if (
          urlPuzzleIndex <= puzzleAvailability.pimantle.max &&
          urlPuzzleIndex < todaysPimantle
        ) {
          newPuzzleNumber = urlPuzzleIndex;
          selectedIsArchivePuzzle = true;
          fallbackMessage = null;
        } else {
          newPuzzleNumber = puzzleAvailability.pimantle.max;
          selectedIsArchivePuzzle = true;
          fallbackMessage =
            `Pimantle #${urlPuzzleIndex} is not included in this build. Opening the latest bundled archive puzzle (#${newPuzzleNumber}) instead.`;
        }
      } else if (
        Number.isInteger(urlPuzzleIndex) &&
        urlPuzzleIndex >= 0 &&
        urlPuzzleType?.startsWith("s")
      ) {
        selectedPuzzleType = "semantle";
        if (
          urlPuzzleIndex <= puzzleAvailability.semantle.max &&
          urlPuzzleIndex < todaysSemantle
        ) {
          newPuzzleNumber = urlPuzzleIndex;
          selectedIsArchivePuzzle = true;
          fallbackMessage = null;
        } else {
          newPuzzleNumber = puzzleAvailability.semantle.max;
          selectedIsArchivePuzzle = true;
          fallbackMessage =
            `Semantle #${urlPuzzleIndex} is not included in this build. Opening the latest bundled archive puzzle (#${newPuzzleNumber}) instead.`;
        }
      }

      setPuzzleType(selectedPuzzleType);
      setIsArchivePuzzle(selectedIsArchivePuzzle);
      setLoadError(null);

      if (selectedPuzzleType === "pimantle") {
        setNextPuzzleTime(
          pimantleEpoch.add(todaysPimantle + 1, "day").toDate()
        );
      } else {
        setNextPuzzleTime(
          semantleEpoch.add(todaysSemantle + 1, "day").toDate()
        );
      }

      setCurrentPuzzle(newPuzzleNumber.toString());
      document.title = `Pimantle${selectedIsArchivePuzzle ? " Archive" : ""}: ${selectedPuzzleType === "pimantle" ? "Pimantle" : "Semantle"} #${newPuzzleNumber}`;

      if (fallbackMessage) {
        toast.warn(fallbackMessage, {
          autoClose: false,
          position: "top-center",
        });
      }

      const puzzleFolder =
        selectedPuzzleType === "pimantle" ? "secret_words" : "semantle_words";
      const puzzleUrl = `/${puzzleFolder}/secret_word_${newPuzzleNumber}.bin?3`;

      window
        .fetch(puzzleUrl, {
          cache: "force-cache",
        })
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Puzzle data request failed (HTTP ${response.status}). The selected puzzle file may be missing from this build.`
            );
          }
          return response.arrayBuffer();
        })
        .then((buffer) => {
          const recordSize = 14;
          if (
            buffer.byteLength < 4 ||
            (buffer.byteLength - 4) % recordSize !== 0
          ) {
            throw new Error(
              "The puzzle data file is incomplete or is not a valid Pimantle dataset."
            );
          }

          const dataView = new DataView(buffer);
          let offset = 4;
          let parsedWords: Word[] = [];
          let rank = 0;
          while (offset < buffer.byteLength) {
            const index = dataView.getUint32(offset, true);
            offset += 4;
            const x = dataView.getFloat32(offset, true);
            offset += 4;
            const y = dataView.getFloat32(offset, true);
            offset += 4;
            const similarity = getFloat16(dataView, offset, true) * 100;
            offset += 2;

            const wordEntry = wordList[index];
            if (
              !wordEntry ||
              typeof wordEntry[0] !== "string" ||
              typeof wordEntry[1] !== "number"
            ) {
              throw new Error(
                `Puzzle data contains an invalid word index (${index}). The word list and puzzle data do not match.`
              );
            }

            parsedWords.push({
              index: index,
              word: wordEntry[0],
              frequency: wordEntry[1],
              similarity: similarity,
              x: x,
              y: y,
              rank: rank,
            });
            rank++;
          }

          if (parsedWords.length === 0) {
            throw new Error("The selected puzzle contains no word data.");
          }
          setSecret(parsedWords[0]);
          let newXValues = parsedWords.map((word) => word.x);
          let newYValues = parsedWords.map((word) => word.y);

          setPlotData([
            {
              x: newXValues,
              y: newYValues,
              text: parsedWords.map((word) => word.word),
              customdata: parsedWords.map((word) => [
                word.similarity.toFixed(2),
                word.rank,
              ]),
              mode: "markers",
              type: "scattergl",
              marker: {
                color: "darkblue",
                opacity: 0.8,
                // color: parsedWords.map((w) => Math.floor(w.rank / 100)),
                // color: parsedWords.map(
                //   (word) => word.rank / parsedWords.length
                // ),
              },
              hoverinfo: "skip",
            },
            {
              x: [parsedWords[0].x],
              y: [parsedWords[0].y],
              mode: "markers",
              type: "scatter",
              marker: {
                color: "yellow",
                size: 15,
                symbol: "star",
              },
              hovertemplate: "<b>Secret word</b><extra></extra>",
              hoverlabel: {
                font: {
                  family: "var(--body-font)",
                },
              },
            },
            {
              x: [],
              y: [],
              customdata: [],
              text: [],
              mode: "markers",
              type: "scatter",
              marker: {
                color: [],
                cmin: 0,
                cmid: 1000,
                cmax: parsedWords.length,
                size: 10,
                colorscale: "Portland",
                reversescale: true,
              },
              hoverlabel: {
                font: {
                  family: "var(--body-font)",
                },
              },
              hovertemplate:
                "<b>%{text}</b><br><br>Similarity: %{customdata[0]}<br>Rank: %{customdata[1]}<br>Your guess: %{customdata[2]}<extra></extra>",
            },
          ]);

          if (disposed) return;
          setParsedWords(parsedWords);

          if (localStorage.getItem("pimantle-offline")) {
            setSocketState("closed");
          } else {
            const socketUrl =
              process.env.REACT_APP_SOCKET_URL ||
              (window.location.hostname === "localhost"
                ? "http://localhost:8000"
                : "https://pimantle-backend.herokuapp.com");
            const socket: Socket<ServerEvent, ClientEvent> = io(socketUrl);
            activeSocket = socket;

            socket.on("connect", () => {
              if (disposed) return;
              setSocketState("connected");
              setSocketGuessHandler(
                () => (
                  x: number,
                  y: number,
                  solveStatus: SolveStatus | undefined
                ) => socket.emit("guess", x, y, solveStatus)
              );
              socket.emit("joinGame", `${selectedPuzzleType}-${newPuzzleNumber}`);
            });

            socket.on("disconnect", () => {
              if (!disposed) {
                setSocketState(
                  localStorage.getItem("pimantle-offline") ? "closed" : "connecting"
                );
              }
            });

            socket.on("connect_error", (error: Error) => {
              console.warn("Multiplayer connection failed:", error.message);
              if (!disposed) setSocketState("connecting");
            });

            socket.io.on("reconnect_attempt", () => {
              if (!disposed) setSocketState("connecting");
            });

            socket.io.on("reconnect", () => {
              if (!disposed) setSocketState("connected");
            });

            // Register these listeners once, rather than once per reconnect.
            socket.on("playerCount", (count: number) => {
              if (!disposed) setPlayersOnline(count);
            });

            socket.on("newGuess", (x: number, y: number) => {
              socketGuessObservable.current.next({ x, y });
            });

            socket.on(
              "guessWithStats",
              (
                x: number,
                y: number,
                incomingStats: StatsUpdate | LesserStatsUpdate
              ) => {
                socketGuessObservable.current.next({ x, y });
                if (!disposed) updateStats(incomingStats);
              }
            );

            socket.on("statsUpdate", (incomingStats: StatsUpdate) => {
              if (!disposed) updateStats(incomingStats);
            });

            setSocketDisconnectCallback(() => () => {
              localStorage.setItem("pimantle-offline", "true");
              setSocketState("closed");
              socket.disconnect();
            });
          }
        })
        .catch((error: unknown) => {
          const message =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred while loading the puzzle.";
          console.error("Pimantle puzzle loading failed:", error);
          setLoadError(message);
          toast.error(message, {
            autoClose: false,
            position: "top-center",
          });
        });
    })().catch((error: unknown) => {
      if (!disposed) {
        const message =
          error instanceof Error ? error.message : "Could not initialize Pimantle.";
        setLoadError(message);
        toast.error(message, { autoClose: false, position: "top-center" });
      }
    });

    return () => {
      disposed = true;
      if (activeSocket) {
        activeSocket.removeAllListeners();
        activeSocket.io.removeAllListeners();
        activeSocket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    setDataRevision((old) => old + 1);
  }, [plotData, plotLayout]);

  function centerPlot(on?: Word) {
    setBizarreEdgeCaseThingIHateIt((old) => old * -1);
    if (parsedWords) {
      let [xRange, yRange] = getAxisRange(
        on ? on : parsedWords[Math.floor(parsedWords.length / 2)]
      );

      xRange[0] += bizarreEdgeCaseThingIHateIt;
      xRange[1] += bizarreEdgeCaseThingIHateIt;
      yRange[0] += bizarreEdgeCaseThingIHateIt;
      yRange[1] += bizarreEdgeCaseThingIHateIt;

      setPlotLayout((prevState: Plotly.Layout) => ({
        ...prevState,
        xaxis: {
          ...prevState.xaxis,
          range: xRange,
        },
        yaxis: {
          ...prevState.yaxis,
          range: yRange,
        },
        uirevision: prevState.uirevision + 1,
      }));
      setDisplayedXRange(xRange);
      setDisplayedYRange(yRange);
    }
  }

  function getAxisRange(target: Word): number[][] {
    console.log("target", target);
    let plotBounds = document
      .getElementById("plot-div")
      ?.getBoundingClientRect();
    let safeBounds = document
      .getElementsByClassName("safe-container")?.[0]
      ?.getBoundingClientRect();

    let bufferSize = 1.5;

    console.log(plotBounds, safeBounds);

    if (plotBounds === undefined || safeBounds === undefined) {
      return [
        [-1, 1],
        [-1, 1],
      ];
    }

    let plotWidth = Math.max(plotBounds.width, 1);
    let plotHeight = Math.max(plotBounds.height, 1);

    let safeLeftMargin = (safeBounds.left - plotBounds.left) / plotWidth;
    let safeRightMargin = (plotBounds.right - safeBounds.right) / plotWidth;
    let safeTopMargin = (safeBounds.top - plotBounds.top) / plotHeight;
    let safeBottomMargin = (plotBounds.bottom - safeBounds.bottom) / plotHeight;

    let safeWidth = Math.max(1 - safeLeftMargin - safeRightMargin, 0.001);
    let safeHeight = Math.max(1 - safeTopMargin - safeBottomMargin, 0.001);

    let plotCenterX = (safeLeftMargin + (1 - safeRightMargin)) / 2;
    let plotCenterY = (safeTopMargin + (1 - safeBottomMargin)) / 2;


    let rangeNeeded = Math.max(
      Math.sqrt(target.x * target.x + target.y * target.y) * bufferSize,
      0.025
    );

    let yAxisRange: number;
    let xAxisRange: number;

    if (plotHeight * safeHeight < plotWidth * safeWidth) {
      yAxisRange = rangeNeeded * 2 + rangeNeeded * 2 * (1 - safeHeight);
      xAxisRange = yAxisRange * (plotWidth / plotHeight);
    } else {
      xAxisRange = rangeNeeded * 2 + rangeNeeded * 2 * (1 - safeWidth);
      yAxisRange = xAxisRange * (plotHeight / plotWidth);
    }

    return [
      [-xAxisRange * plotCenterX, xAxisRange * (1 - plotCenterX)],
      [-yAxisRange * (1 - plotCenterY), yAxisRange * plotCenterY],
    ];
  }

  return (
    <div className="App">
      <ToastContainer
        position="top-left"
        hideProgressBar
        toastClassName="toast-blur"
        autoClose={5000}
        theme="dark"
      />
      {socketState === "connected" && (
        <MultiplayerBackground
          xRange={displayedXRange}
          yRange={displayedYRange}
          guessObservable={socketGuessObservable}
        />
      )}
      <div className="header">
        <ServerPanel
          socketState={socketState}
          playersOnline={playersOnline}
          socketDisconnectCallback={socketDisconnectCallback}
        />
        <span
          className="header-link"
          onClick={() => setArchiveOpen(true)}
          title="Puzzle archives"
        >
          {puzzleType === "semantle" ? "Semantle" : "Pimantle"} #{currentPuzzle}{" "}
          {isArchivePuzzle && "(archive puzzle)"}
        </span>
        <span className="header-right">
          {/*<span*/}
          {/*  className="header-link"*/}
          {/*  onClick={() => setSettingsOpen(true)}*/}
          {/*  title="Settings"*/}
          {/*>*/}
          {/*  ⚙*/}
          {/*</span>*/}
        </span>
      </div>
      <ArchiveDropdown
        isOpen={archiveOpen}
        close={() => setArchiveOpen(false)}
        archivePimantles={archivePimantles}
        archiveSemantles={archiveSemantles}
      />
      <SettingsDropdown
        isOpen={settingsOpen}
        close={() => setSettingsOpen(false)}
      />
      {parsedWords.length > 0 && (
        <div className="game-container">
          <div className="layout-container">
            <Guesses
              guesses={guesses}
              setGuesses={setGuesses}
              parsedWords={parsedWords}
              puzzleType={puzzleType}
              currentPuzzle={currentPuzzle}
              stats={stats}
              socketState={socketState}
              socketGuessHandler={socketGuessHandler}
              scroller={scroller}
              hoverEnabled={hoverEnabled}
              plotData={plotData}
              setPlotData={setPlotData}
              isArchivePuzzle={isArchivePuzzle}
              defaultLayout={defaultLayout}
              secret={secret}
              nextPuzzleTime={nextPuzzleTime}
              centerPlot={centerPlot}
            />
            <div className="safe-container" />
          </div>

          <PlotContainer
            plotProperties={{ plotData, hoverEnabled }}
            parsedWords={parsedWords}
            plotLayout={plotLayout}
            revision={dataRevision}
            setDisplayedXRange={setDisplayedXRange}
            setDisplayedYRange={setDisplayedYRange}
            onInit={() => centerPlot()}
          />
        </div>
      )}
      {parsedWords.length === 0 && (
        <div className="loading-container">
          <div className="loading-text">
            {loadError ? "Unable to load puzzle" : `Loading the ${puzzleType === "semantle" ? "Semantle" : "Pimantle"}...`}
          </div>
          {loadError && <div className="loading-error">{loadError}</div>}
        </div>
      )}
      <div id={"hidden-plot"} />
    </div>
  );
}

export default App;
