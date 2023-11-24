import { useState, useEffect } from "react";
import marketDataJSON from "./markets.json";

function App() {
  const [userTime, setUserTime] = useState(new Date());
  const [decimalTime, setDecimalTime] = useState(
    userTime.getHours() + userTime.getMinutes() / 60
  );
  const dayOfWeek = userTime.getUTCDay();

  useEffect(() => {
    const intervalId = setInterval(() => {
      setUserTime(new Date());
      setDecimalTime(userTime.getHours() + userTime.getMinutes() / 60);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  //Timezone in decimals (UTC +5:30 becomes 5,5)
  const timezone =
    userTime.getHours() -
    userTime.getUTCHours() +
    (userTime.getMinutes() - userTime.getUTCMinutes()) / 60;

  const [timezoneHours, setTimezoneHours] = useState(
    userTime.getHours() - userTime.getUTCHours()
  );
  const timezoneMinutes = Math.abs(
    userTime.getMinutes() - userTime.getUTCMinutes()
  );

  //Format the displayed timezone
  const formattedTimezone = () => {
    // Case: UTC is one day ahead of local
    if (
      userTime.getUTCHours() < userTime.getHours() &&
      (userTime.getUTCDay() > userTime.getDay() ||
        userTime.getUTCMonth() > userTime.getMonth())
    ) {
      setTimezoneHours(userTime.getHours() - 24 - userTime.getUTCHours());
    }

    // Case: UTC is one day behind local
    if (
      userTime.getUTCHours() > userTime.getHours() &&
      (userTime.getUTCDay() < userTime.getDay() ||
        userTime.getUTCMonth() < userTime.getMonth())
    ) {
      setTimezoneHours(userTime.getHours() + 24 - userTime.getUTCHours());
    }

    if (timezoneHours > 0 && timezoneMinutes !== 0) {
      return `+${timezoneHours}:${timezoneMinutes}`;
    }

    if (timezoneHours > 0 && timezoneMinutes === 0) {
      return `+${timezoneHours}`;
    }

    if (timezoneHours < 0 && timezoneMinutes !== 0) {
      return `${timezoneHours}:${timezoneMinutes}`;
    }

    if (timezoneHours < 0 && timezoneMinutes === 0) {
      return timezoneHours;
    }
  };

  const convertTime = (time) => {
    //Needs UTC decimal times to work
    return time + timezone;
  };

  const displayConvertedTime = (time) => {
    const timeMinutes = (time % 1) * 60;

    let totalMinutes = timeMinutes + timezoneMinutes;
    let extraHours = 0;

    if (totalMinutes >= 60) {
      totalMinutes = totalMinutes % 60;
      extraHours = Math.floor(totalMinutes / 60);
    }

    let hours = Math.floor(time) + Math.floor(timezone);

    if (hours < 0) {
      hours = hours + 24;
    }

    if (hours >= 24) {
      hours = hours - 24;
    }

    const formattedMinutes =
      totalMinutes < 10 ? `0${totalMinutes}` : totalMinutes;

    return `${hours + extraHours}:${formattedMinutes}`;
  };

  //Times in UTC for easier conversion
  const [marketData, setMarketData] = useState([]);

  useEffect(() => {
    try {
      const parsedMarketData = marketDataJSON;
      setMarketData(parsedMarketData);
    } catch (error) {
      console.log("Error parsing market data: ", error);
    }
  }, []);

  //Play bell at NY open, once
  const [hasPlayedBell, setHasPlayedBell] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);

  useEffect(() => {
    if (
      !hasPlayedBell &&
      isSoundEnabled &&
      decimalTime === 13.5 + timezone &&
      (dayOfWeek !== 0 || dayOfWeek !== 6)
    ) {
      new Audio("bell.mp3").play();
      setHasPlayedBell(true);
    }

    if (decimalTime !== 13.5 + timezone) {
      setHasPlayedBell(false);
    }
  });

  return (
    <div className="flex flex-col w-screen h-screen">
      <div className="flex justify-between px-9 pt-6 items-center">
        <div className="flex gap-3">
          <img src="logo.png" width={32} height={30} alt="logo" />
          <h1 className="text-2xl hidden sm:block">MktClock</h1>
        </div>
        <div className="flex gap-9 items-center">
         
          <button
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className={`w-32 py-2 border-2 border-white rounded-md transition duration-500 hover:bg-white hover:text-black ${
              isSoundEnabled && "bg-white text-black"
            }`}
          >
            {isSoundEnabled ? "Disable bell" : "Enable bell"}
          </button>
        </div>
      </div>

      <div className="w-full h-fit sm:h-full px-16 py-16 lg:py-0 flex flex-col gap-16 items-center justify-center">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex flex-col items-center">
            <h2 className="text-7xl">
              {userTime.getHours()}:
              {userTime.getMinutes() < 10
                ? `0${userTime.getMinutes()}`
                : userTime.getMinutes()}
            </h2>
            <div className="flex gap-3 items-center">
              <h3 className="text-xl">Current Time</h3>
              <p className="text-sm">(UTC {formattedTimezone()})</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-16">
            {marketData.map((item) => {
              return (
                <div
                  key={item.market}
                  className={`flex flex-col items-center ${
                    dayOfWeek === 6 || dayOfWeek === 0
                      ? "text-grey"
                      : decimalTime >= convertTime(item.preMarket) &&
                        decimalTime < convertTime(item.preMarketClose)
                      ? "text-yellow"
                      : decimalTime >= convertTime(item.marketOpen) &&
                        decimalTime < convertTime(item.marketClose)
                      ? "text-green"
                      : decimalTime >= convertTime(item.secondMarketOpen) &&
                        decimalTime < convertTime(item.secondMarketClose)
                      ? "text-green"
                      : decimalTime >= convertTime(item.marketClose) &&
                        decimalTime < convertTime(item.postMarketClose)
                      ? "text-blue"
                      : "text-grey"
                  }`}
                >
                  <h2 className="text-5xl">
                    {displayConvertedTime(item.marketOpen)}
                  </h2>
                  <h3 className="text-xl">{item.market}</h3>
                </div>
              );
            })}
          </div>
        </div>

        {/* NYSE Market Open Bell */}
        {decimalTime === 13.3 + timezone && (
          <audio src={""} autoplay auto="true" />
        )}

        <div className="flex flex-wrap gap-9 w-full justify-center">
          <div className="flex gap-3">
            <div className="h-6 w-6 bg-grey" />
            <p>Market Closed</p>
          </div>
          <div className="flex gap-3">
            <div className="h-6 w-6 bg-yellow" />
            <p>Pre-market</p>
          </div>
          <div className="flex gap-3">
            <div className="h-6 w-6 bg-green" />
            <p>Market Open</p>
          </div>
          <div className="flex gap-3">
            <div className="h-6 w-6 bg-blue" />
            <p>Post-market</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
