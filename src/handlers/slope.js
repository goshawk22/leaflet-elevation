export function Slope() {

	const _ = L.Control.Elevation.Utils;

	let opts  = this.options;
	let slope = {};

	slope.label          = opts.slopeLabel || '%';

	// Number of points for moving average
	const windowSize = 3;

	let accumulatedDx = 0;
	let accumulatedDy = 0;

	return {
		name: 'slope',
		meta: 'slope',
		unit: slope.label,
		deltaMax: this.options.slopedDeltaMax,
		clampRange: this.options.slopeRange,
		decimals: 2,
		pointToAttr: function(_, i) {
			let sumDx = 0;
			let sumDy = 0;
			let count = 0;
			for (let j = Math.max(1, i - windowSize + 1); j <= i; j++) {
				let dx = (this._data[j].dist - this._data[j - 1].dist) * 1000;
				let dy = this._data[j][this.options.yAttr] - this._data[j - 1][this.options.yAttr];
				sumDx += dx;
				sumDy += dy;
				count++;
			}
			return sumDx !== 0 ? (sumDy / sumDx) * 100 : NaN;
		},
		onPointAdded: function(_, i) {
			let dz = this._data[i][this.options.yAttr] - this._data[i > 0 ? i - 1 : i][this.options.yAttr];
			let dx = (this._data[i].dist - this._data[i > 0 ? i - 1 : i].dist) * 1000;

			if (dz > 0)      this.track_info.ascent  = (this.track_info.ascent || 0) + dz;  // Total Ascent
			else if (dz < 0) this.track_info.descent = (this.track_info.descent || 0) - dz; // Total Descent

			accumulatedDx += dx;
			accumulatedDy += dz;

			if (accumulatedDx >= 50) {
				let point_slope = accumulatedDx !== 0 ? (accumulatedDy / accumulatedDx) * 100 : NaN;
				this.track_info.slope_min = Math.min(this.track_info.slope_min || point_slope, point_slope);
				this.track_info.slope_max = Math.max(this.track_info.slope_max || point_slope, point_slope);
				accumulatedDx = 0;
				accumulatedDy = 0;
			}
		},
		stats: { 
			avg: _.iAvg,
		},
		scale: {
			axis       : "y",
			position   : "right",
			scale      : { min: -1, max: +1 },
			tickPadding: 16,
			labelX     : 25,
			labelY     : -8,
		},
		path: {
			label        : 'Slope',
			yAttr        : 'slope',
			scaleX       : 'distance',
			scaleY       : 'slope',
			color        : '#F00',
			strokeColor  : '#000',
			strokeOpacity: "0.5",
			fillOpacity  : "0.25",
		},
		tooltip: {
			chart: (item) => L._("m: ") + item.slope + slope.label,
			marker: (item) => Math.round(item.slope) + slope.label,
			order: 40,
		},
		summary: {
			"minslope": {
				label: "Min Slope: ",
				value: (track, unit) => Math.round(track.slope_min || 0) + '&nbsp;' + unit,
				order: 40
			},
			"maxslope": {
				label: "Max Slope: ",
				value: (track, unit) => Math.round(track.slope_max || 0) + '&nbsp;' + unit,
				order: 41
			},
			"avgslope": {
				label: "Avg Slope: ",
				value: (track, unit) => Math.round(track.slope_avg || 0) + '&nbsp;' + unit,
				order: 42
			},
			"ascent"  : {
				label: "Total Ascent: ",
				value: (track, unit) => Math.round(track.ascent || 0) + '&nbsp;' + (this.options.imperial ? 'ft' : 'm'),
				order: 43
			},
			"descent"  : {
				label: "Total Descent: ",
				value: (track, unit) => Math.round(track.descent || 0) + '&nbsp;' + (this.options.imperial ? 'ft' : 'm'),
				order: 45
			},
		}
	};
}
