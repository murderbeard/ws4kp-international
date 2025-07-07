// display extended forecast graphically
// technically uses the same data as the local forecast, we'll let the browser do the caching of that

import STATUS from './status.mjs';
import { getWeatherIconFromIconLink } from './icons.mjs';
import WeatherDisplay from './weatherdisplay.mjs';
import { registerDisplay } from './navigation.mjs';
import { getConditionText } from './utils/weather.mjs';

import ConversionHelpers from './utils/conversionHelpers.mjs';

class ExtendedForecast extends WeatherDisplay {
	constructor(navId, elemId) {
		super(navId, elemId, 'Extended Forecast', true);

		// set timings
		this.timing.totalScreens = 2;
	}

	static dayConditionTextSanitizer(text) {
		let sanitizedText;
		const spaces = text.split(' ');

		if (spaces.length > 2) {
			// text is too long, first word is
			// likely "Slight" so we'll cut it.
			sanitizedText = spaces.slice(0, 2).join(' ');

			return sanitizedText;
		}

		// Special case for thunderstorm(s), as
		// it clips into the other day panels
		if (text.toLowerCase() === 'thunderstorm') {
			// special case for thunderstorms
			sanitizedText = 'Thunder';
			return sanitizedText;
		}

		return text;
	}

	async getData(_weatherParameters) {
		if (!super.getData(_weatherParameters)) return;

		this.data = parse(_weatherParameters);
		this.screenIndex = 0;
		this.setStatus(STATUS.loaded);
	}

	async drawCanvas() {
		super.drawCanvas();

		// determine bounds
		// grab the first three or second set of three array elements
		const forecast = this.data.slice(0 + 3 * this.screenIndex, 3 + this.screenIndex * 3);

		// create each day template
		const days = forecast.map((Day) => {
			const fill = {
				icon: { type: 'img', src: Day.icon },
				condition: ExtendedForecast.dayConditionTextSanitizer(Day.text),
				date: Day.dayName,
			};

			const { low } = Day;
			if (low !== undefined) {
				fill['value-lo'] = Math.round(low);
			}
			const { high } = Day;
			fill['value-hi'] = Math.round(high);

			// return the filled template
			return this.fillTemplate('day', fill);
		});

		// empty and update the container
		const dayContainer = this.elem.querySelector('.day-container');
		dayContainer.innerHTML = '';
		dayContainer.append(...days);
		this.finishDraw();
	}
}

// the api provides the forecast in 12 hour increments, flatten to day increments with high and low temperatures
const parse = (fullForecast) => {
	const forecast = [];

	Object.values(fullForecast.forecast).forEach((period) => {
		const text = getConditionText(parseInt(period.weather_code, 10));
		const date = new Date(period.hours[11].time);

		const fDay = {
			text,
			icon: getWeatherIconFromIconLink(text, fullForecast.timeZone, true),
			date,
			dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
			high: ConversionHelpers.convertTemperatureUnits(period.temperature_2m_max),
			low: ConversionHelpers.convertTemperatureUnits(period.temperature_2m_min),
		};

		forecast.push(fDay);
	});

	return forecast;
};

// register display
registerDisplay(new ExtendedForecast(8, 'extended-forecast'));
