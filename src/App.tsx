import React, { useEffect, useState, ChangeEvent } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import "./App.css";
import { format, sub, endOfDay, startOfDay } from "date-fns";
import data from "./data";

type tabSummaryType = { ts: number; count: number; date: Date; dateStr: string; hourStr: string }[];

const App = () => {
  const [tabActivity, setTabActivity] = useState<tabSummaryType>([]);
  const [filteredTabActivity, setFilteredTabActivity] = useState<tabSummaryType>([]);
  const [startFilter, setStartFilter] = useState<Date | null>(null);
  const [endFilter, setEndFilter] = useState<Date | null>(null);
  const [dayFilter, setDayFilter] = useState(-1);

  /**useEffect(() => {
    chrome.storage.local.get(["tabChanges", "tabActivity"], function (result) {
      const arrOfTS: number[] = result.tabChanges || [];
      const tabActivityStr: tabSummaryType = result.tabActivity || [];
      const summary = tabActivityStr.map((ta) => ({ ts: ta.ts, count: ta.count, date: new Date(ta.date) }));
      // nearest 5 minute window
      const fiveMins = 1000 * 60 * 5;
      const maxBookend = Math.floor(Math.max(...arrOfTS) / fiveMins) * fiveMins;

      const minTS = Math.min(...arrOfTS);
      const minBookend = Math.floor(minTS / fiveMins) * fiveMins;
      // console.log(arrOfTS, summary, maxBookend, minBookend);

      // now loop through 5min range and record counts
      for (let currentTS = minBookend; currentTS < maxBookend; currentTS += fiveMins) {
        // console.log("Current loop", currentTS, new Date(currentTS).toLocaleTimeString());
        // calc maxR
        const maxR = currentTS + fiveMins;
        // filter  and count
        const count = arrOfTS.filter((ts) => currentTS < ts && ts < maxR).length;
        // save count
        // console.log("Count:", count);

        summary.push({ ts: currentTS, count: count, date: new Date(currentTS) });
      }
      console.log("new tabActivity", summary);

      // Save left over tab changes
      // const remainingTabChanges = arrOfTS.filter((ts) => ts > maxBookend);
      // chrome.storage.local.set({ tabChanges: remainingTabChanges, tabActivity:    });
      setTabActivity(summary);
    });
  }, []); **/

  useEffect(() => {
    const arrOfTS: number[] = data();
    const tabActivityStr: tabSummaryType = []; // won't be right - need to toJson() the date
    const summary: tabSummaryType = tabActivityStr.map((ta) => ({
      ts: ta.ts,
      count: ta.count,
      date: new Date(ta.date),
      dateStr: ta.dateStr,
      hourStr: ta.hourStr,
    }));
    // nearest 5 minute window
    const fiveMins = 1000 * 60 * 5;
    const maxBookend = Math.floor(Math.max(...arrOfTS) / fiveMins) * fiveMins;

    const minTS = Math.min(...arrOfTS);
    const minBookend = Math.floor(minTS / fiveMins) * fiveMins;
    // console.log(arrOfTS, summary, maxBookend, minBookend);

    // now loop through 5min range and record counts
    for (let currentTS = minBookend; currentTS < maxBookend; currentTS += fiveMins) {
      const maxR = currentTS + fiveMins;
      const count = arrOfTS.filter((ts) => currentTS < ts && ts < maxR).length;
      const d = new Date(currentTS);
      summary.push({ ts: currentTS, count: count, date: d, hourStr: format(d, "H:mm"), dateStr: format(d, "eee do") });
    }
    console.log("new tabActivity", summary);

    const DELETE_SPAN_SEARCH = 7;
    let zeroCount = 0;
    for (let i = summary.length - 1; i >= 0; i--) {
      const item = summary[i];
      if (item.count === 0) {
        zeroCount++;
      } else {
        if (zeroCount >= DELETE_SPAN_SEARCH) {
          summary.splice(i + 1, zeroCount - 2);
        }
        zeroCount = 0;
      }
    }

    // Save left over tab changes
    // const remainingTabChanges = arrOfTS.filter((ts) => ts > maxBookend);
    // chrome.storage.local.set({ tabChanges: remainingTabChanges, tabActivity:    });
    setTabActivity(summary);
    // setFilteredTabActivity(summary);
    setEndFilter(summary[summary.length - 1].date);
    setStartFilter(summary[0].date);
  }, []);

  useEffect(() => {
    // filter tabActivity
    if (endFilter && startFilter) {
      setFilteredTabActivity(tabActivity.filter((tc) => tc.date > startFilter && tc.date < endFilter));
    }
  }, [endFilter, startFilter, tabActivity]);

  useEffect(() => {
    if (dayFilter >= 0) {
      const newDate = sub(new Date(), { days: dayFilter });
      // setEndFilter to endOfDay
      setEndFilter(endOfDay(newDate));
      // setStartFilter to startOfDay
      setStartFilter(startOfDay(newDate));
    } else if (tabActivity.length > 0) {
      setEndFilter(tabActivity[tabActivity.length - 1].date);
      setStartFilter(tabActivity[0].date);
    }
  }, [dayFilter, tabActivity]);

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
          <ResponsiveContainer width={"90%"} height={300}>
            <BarChart data={filteredTabActivity} margin={{ top: 50, right: 30, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="5 5" vertical={false} />
              <XAxis dataKey="hourStr" />
              <XAxis dataKey="dateStr" axisLine={false} tickLine={false} xAxisId="date" />
              <YAxis />
              <Tooltip />
              {/* <Line type="monotone" dataKey="count" stroke="#8884d8" /> */}
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6">
          <p className="text-lg font-bold mb-6">Filters</p>
          <div className="flex text-left max-w-2xl mx-auto">
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
              <p className="text-gray-600 text-sm">Day filters</p>
              <select name="dayFilter" id="dayFilter" onChange={handleDayChange} className={inputCSS}>
                {daySelectOptions.map((dso) => (
                  <option value={dso.value} label={dso.label} key={dso.value} />
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
