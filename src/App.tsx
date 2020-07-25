import React, { useEffect, useState, ChangeEvent } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  ReferenceLine,
} from "recharts";
import "./App.css";
import { format, sub, endOfDay, add, startOfHour, setHours } from "date-fns";
import useChromeLocalStorage from "./lib/useChromeLocalStorage";

type tabSummaryType = tabDataSlice[];

type tabDataSlice = {
  ts: number;
  count: number;
  date: Date;
  dateStr: string;
  hourStr: string;
  moodRating?: number;
};

const minuteMS = 1000 * 60;

const App = () => {
  const [tabActivity, setTabActivity] = useState<tabSummaryType>([]);
  const [filteredTabActivity, setFilteredTabActivity] = useState<
    tabSummaryType
  >([]);
  const [startFilter, setStartFilter] = useState<Date | null>(null);
  const [endFilter, setEndFilter] = useState<Date | null>(null);
  const [dayFilter, setDayFilter] = useState(-1);
  const [removeInactivePeriods, setRemoveInactivePeriods] = useState(true);
  const [yAxisLimit, setYAxisLimit] = useChromeLocalStorage("yAxisLimit", 20);
  const [dayStartAt, setDayStartAt] = useChromeLocalStorage("dayStartAt", 8);
  const [showRefLine, setShowRefLine] = useState<null | number>(null);
  const [chartGrouping, setChartGrouping] = useState(minuteMS * 5); // five mins default
  const [changeThreshold, setChangeThreshold] = useChromeLocalStorage(
    "changeThreshold",
    10
  ); // threshold to get mood input when change > this

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key; // "ArrowRight", "ArrowLeft", "ArrowUp", or "ArrowDown"
      if (key === "ArrowLeft") {
        setDayFilter(dayFilter + 1);
      } else if (key === "ArrowRight") {
        setDayFilter(Math.max(dayFilter - 1, 0));
      }
    };
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [dayFilter]);

  useEffect(() => {
    chrome.storage.local.get(
      ["tabChanges", "tabActivity", "moodRatings"],
      function (result) {
        const arrOfTS: number[] = result.tabChanges || [];
        const tabActivityStr: tabSummaryType = result.tabActivity || []; // won't be right - need to toJson() the date
        const moodRatings: { time: number; rating: number }[] =
          result.moodRatings || [];
        const summary: tabSummaryType = tabActivityStr.map((ta) => ({
          ts: ta.ts,
          count: ta.count,
          date: new Date(ta.date),
          dateStr: ta.dateStr,
          hourStr: ta.hourStr,
        }));
        // nearest 5 minute window
        const maxBookend =
          Math.floor(Math.max(...arrOfTS) / chartGrouping) * chartGrouping;

        const minTS = Math.min(...arrOfTS);
        const minBookend = Math.floor(minTS / chartGrouping) * chartGrouping;
        console.log(
          "Calculated the bookend stuff",
          new Date().toLocaleTimeString()
        );

        // now loop through 5min range and record counts
        for (
          let currentTS = minBookend;
          currentTS < maxBookend;
          currentTS += chartGrouping
        ) {
          const maxR = currentTS + chartGrouping;
          const count = arrOfTS.filter((ts) => currentTS < ts && ts < maxR)
            .length;
          const mood = moodRatings.filter(
            (mr) => currentTS < mr.time && mr.time < maxR
          );
          const d = new Date(currentTS);
          const dataPoint: tabDataSlice = {
            ts: currentTS,
            count: count,
            date: d,
            hourStr: format(d, "H:mm"),
            dateStr: format(d, "eee do"),
          };
          if (mood.length > 0) {
            // add to dataPoint
            dataPoint.moodRating = mood[0].rating;
          }
          summary.push(dataPoint);
          // console.log("looping", currentTS, count);
        }
        console.log(
          "Finished creating summary",
          new Date().toLocaleTimeString()
        );

        // Save left over tab changes
        // const remainingTabChanges = arrOfTS.filter((ts) => ts > maxBookend);
        // chrome.storage.local.set({ tabChanges: remainingTabChanges, tabActivity: summary });
        setTabActivity(summary);
        setEndFilter(add(summary[summary.length - 1].date, { hours: 1 }));
        setStartFilter(sub(summary[0].date, { hours: 1 }));
      }
    );
  }, [chartGrouping]);

  useEffect(() => {
    // filter tabActivity
    let tabActivityCopy = tabActivity.slice(0);

    if (endFilter && startFilter) {
      tabActivityCopy = tabActivityCopy.filter(
        (tc) => tc.date > startFilter && tc.date < endFilter
      );
    }

    if (removeInactivePeriods) {
      const DELETE_SPAN_SEARCH = 7;
      let zeroCount = 0;
      for (let i = tabActivityCopy.length - 1; i >= 0; i--) {
        const item = tabActivityCopy[i];
        if (item.count === 0) {
          zeroCount++;
          // Catch the start
          if (i === 0) {
            console.log("Start was empty");
            tabActivityCopy.splice(i, zeroCount);
          }
        } else {
          if (zeroCount >= DELETE_SPAN_SEARCH) {
            tabActivityCopy.splice(i + 1, zeroCount - 2);
          }
          zeroCount = 0;
        }
      }
    }

    setFilteredTabActivity(tabActivityCopy);
  }, [endFilter, startFilter, tabActivity, removeInactivePeriods]);

  useEffect(() => {
    if (dayFilter >= 0) {
      const newDate = sub(new Date(), { days: dayFilter });
      // setEndFilter to endOfDay
      setEndFilter(endOfDay(newDate));
      // setStartFilter to startOfDay business day @ 8am
      setStartFilter(startOfHour(setHours(newDate, dayStartAt)));
    } else if (tabActivity.length > 0) {
      setEndFilter(add(tabActivity[tabActivity.length - 1].date, { hours: 1 }));
      setStartFilter(sub(tabActivity[0].date, { hours: 1 }));
    }
  }, [dayFilter, tabActivity, dayStartAt]);

  const inputCSS = "p-2 bg-gray-200 mt-2 text-gray-700 w-full h-12";

  const formatDateForInput = (d: Date | null) => {
    if (d) {
      return format(d, "yyyy-MM-dd'T'HH:mm");
    }
    return "";
  };

  const handleFromChange = (e: ChangeEvent<HTMLInputElement>) => {
    setStartFilter(new Date(e.target.value));
  };

  const handleToChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEndFilter(new Date(e.target.value));
  };

  const daySelectOptions = [
    { value: -1, label: "All days" },
    { value: 0, label: format(new Date(), "EEEE do MMM '(Today)'") },
    { value: 1, label: format(sub(new Date(), { days: 1 }), "EEEE do MMM") },
    { value: 2, label: format(sub(new Date(), { days: 2 }), "EEEE do MMM") },
    { value: 3, label: format(sub(new Date(), { days: 3 }), "EEEE do MMM") },
    { value: 4, label: format(sub(new Date(), { days: 4 }), "EEEE do MMM") },
    { value: 5, label: format(sub(new Date(), { days: 5 }), "EEEE do MMM") },
  ];

  // DAY CHANGE INPUT STUFF
  const handleDayChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setDayFilter(Number(e.target.value));
  };

  return (
    <div className="App lg:container text-gray-700 my-6 text-center mx-auto">
      <h1 className="text-gray-800 font-bold text-3xl">The Keeper</h1>
      <div>
        <h2>Number of tab changes per 5 mins</h2>

        <div className="flex justify-center">
          <ResponsiveContainer width={"90%"} height={250}>
            <ComposedChart
              data={filteredTabActivity}
              margin={{ top: 50, right: 25, left: 5, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="5 5"
                vertical={false}
                stroke="#E9D8FD"
              />
              <XAxis dataKey="hourStr" />
              <XAxis
                dataKey="dateStr"
                axisLine={false}
                tickLine={false}
                xAxisId="date"
              />
              <YAxis
                label={{
                  value: "Tab changes",
                  angle: -90,
                  position: "insideLeft",
                }}
                domain={[0, yAxisLimit]}
                allowDataOverflow={true}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[1, 5]}
                label={{
                  value: "Productivity",
                  angle: -90,
                  position: "insideRight",
                }}
                ticks={[1, 2, 3, 4, 5]}
              />
              <Tooltip />
              <Bar dataKey="count" fill="#9F7AEA" />
              <Line
                type="monotone"
                dataKey="moodRating"
                stroke="#ff5f90"
                connectNulls
                strokeWidth={2}
                yAxisId="right"
              />
              {showRefLine != null && (
                <ReferenceLine y={showRefLine} label="Ref" stroke="#48BB78" />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6">
          <p className="text-lg font-bold mb-6">Filters</p>
          <div className="flex text-left max-w-2xl mx-auto p-5 border-2 border-gray-200">
            <div className="flex-1 mx-2">
              <p className="text-gray-600 text-sm">From</p>
              <input
                type="datetime-local"
                name="from"
                id="from"
                className={inputCSS}
                value={formatDateForInput(startFilter)}
                onChange={handleFromChange}
              />
              <p className="text-gray-600 text-sm mt-4">To</p>
              <input
                type="datetime-local"
                name="to"
                id="to"
                className={inputCSS}
                value={formatDateForInput(endFilter)}
                onChange={handleToChange}
              />
            </div>
            <div className="flex-1 mx-2">
              <p className="text-gray-600 text-sm">
                Day filters
                <button
                  className="float-right underline text-gray-600 px-2 hover:bg-gray-300"
                  onClick={() => setDayFilter(0)}
                >
                  today only
                </button>
                <button
                  className="float-right underline text-gray-600 px-2 hover:bg-gray-300 ml-1"
                  onClick={() => setDayFilter(-1)}
                >
                  all days
                </button>
              </p>
              <select
                name="dayFilter"
                id="dayFilter"
                onChange={handleDayChange}
                className={inputCSS}
                value={dayFilter}
              >
                {daySelectOptions.map((dso) => (
                  <option value={dso.value} label={dso.label} key={dso.value} />
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {"<"} use arrows to change days {">"}
              </p>
              <p className="text-gray-600 text-sm mt-4">Options </p>
              <div className="mt-2 p-2 bg-gray-200 text-sm">
                <label className="block cursor-pointer mb-2 px-2 py-1">
                  <input
                    type="checkbox"
                    className="mr-3"
                    onClick={() => {
                      setRemoveInactivePeriods(!removeInactivePeriods);
                    }}
                    checked={removeInactivePeriods}
                  />
                  Remove inactive periods
                </label>
                <div className="my-2">
                  <input
                    type="number"
                    name="dayStart"
                    id="dayStart"
                    max={12}
                    min={0}
                    className="w-16 mr-2 px-2 py-1"
                    onChange={(e) => setDayStartAt(Number(e.target.value))}
                    value={dayStartAt}
                  />
                  <span>start of day (am)</span>
                </div>
                <div className="my-2">
                  <input
                    type="number"
                    name="yAxisLimit"
                    id="yAxisLimit"
                    max={100}
                    min={10}
                    className="w-16 mr-2 px-2 py-1"
                    onChange={(e) => setYAxisLimit(Number(e.target.value))}
                    value={yAxisLimit}
                  />
                  <span>limit of y axis</span>
                </div>
                <div className="my-2">
                  <input
                    type="number"
                    name="refLine"
                    id="refLine"
                    className="w-16 mr-2 px-2 py-1"
                    onChange={(e) => setShowRefLine(Number(e.target.value))}
                    value={showRefLine === null ? "" : showRefLine}
                    placeholder="..."
                  />
                  <span>show reference line</span>
                </div> 
                <div className="my-2">
                  <input
                    type="number"
                    name="changeThreshold"
                    id="changeThreshold"
                    className="w-16 mr-2 px-2 py-1"
                    onChange={(e) => setChangeThreshold(Number(e.target.value))}
                    value={changeThreshold}
                    placeholder="..."
                  />
                  <span>Tab change threshold for checkin</span>
                </div>
                <div className="my-2">
                  <select
                    name="chartGrouping"
                    id="chartGrouping"
                    onChange={(e) => setChartGrouping(Number(e.target.value))}
                    className="w-16 mr-2 px-2 py-1"
                    value={chartGrouping}
                  >
                    <option value={5 * minuteMS} label={"5m"} />
                    <option value={10 * minuteMS} label={"10m"} />
                    <option value={15 * minuteMS} label={"15m"} />
                    <option value={30 * minuteMS} label={"30m"} />
                    <option value={60 * minuteMS} label={"60m"} />
                  </select>
                  <span>timespan groups</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
