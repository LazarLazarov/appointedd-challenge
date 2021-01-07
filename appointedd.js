fs = require('fs');
_ = require('lodash');
fs.readFile( __dirname + '/input.txt', function (err, data) {
	if (err) {
		throw err; 
	}
	workerArray = []
	lines = data.toString().trim().split("\n")
	// Process string data into domain objects
	lines.forEach(line => {
		lineArray = line.split("@")
		freeintervals = []
		lineArray[1].replace(/\[|]/gm, '').split(",").forEach(date => {
			freeintervalArray = date.trim("").split("/")
			freeintervals.push({start: new Date(freeintervalArray[0]), end: new Date(freeintervalArray[1])})
		})
		workerArray.push({id: lineArray[0], freeIntervals: freeintervals})
	})

	//Set min and max date values (beware will stop working after ~270,000 years)
	earliestStart = new Date(271821, 3, 20)
	latestEnd = new Date(-271821, 3, 20)
	intervalMap = new Map()
	// Transform into more easily processable form
	workerArray.forEach((worker, index) => {
		worker.freeIntervals.forEach(interval => {
			if (interval.start < earliestStart) earliestStart = interval.start
			if (interval.end > latestEnd) latestEnd = interval.end

			// use A and Z to create unique keys for start and end intervals with the same timestamp
			intervalStartKey = interval.start.toISOString() + "-A"
			intervalEndKey = interval.end.toISOString() + "-Z"

			addInterval(intervalMap, intervalStartKey, worker.id, "start");
			addInterval(intervalMap, intervalEndKey, worker.id, "end");
		})
	})
	// Sort by start and end times
	sortedIntervals = new Map([...intervalMap.entries()].sort());
	overlappingIntervals = new Map()
	stack = new Array()
	// Discover overlapping intervals using pseudo bracked matching on start and end times
	sortedIntervals.forEach((metadata, interval) => {
		switch (metadata.type) {
			case "start":
				stack.push({interval, metadata})
				break
			case "end":
				for (i = stack.length-1; i >= 0; i--) {
					stackIds = stack[i].metadata.ids
					// Because we can't remove elements from the stack while traversing, we're setting the worker ID to an empty array to skip those entries
					if (stackIds.length > 0) {
						xor = _.xor(stackIds, metadata.ids);
						diff = _.difference(stackIds, metadata.ids);
						// Slicing the -A and -Z off as they're no longer needed
						overlappingIntervalsKey = stack[i].interval.slice(0,-2)+"/"+interval.slice(0,-2)
						if (stack[i].interval.slice(0,-2) != interval.slice(0,-2)) {
							if (xor.length <= stack[i].metadata.ids.length) {
								overlappingIntervals.set(overlappingIntervalsKey, stack[i].metadata.ids)
								stack[i].metadata.ids = diff
								// If the elements are exactly the same, we can break early and save some computation
								if (xor.length === 0) break
							} else {
								overlappingIntervals.set(overlappingIntervalsKey, xor)
							}
						}
					}
				}
				break
		}
	})

	// Print out results
	console.log("Q1 Answer:")
	console.log(earliestStart.toISOString())
	console.log("Q2 Answer:")
	console.log(latestEnd.toISOString())
	console.log("Q3 Answer:")
	overlappingIntervals.forEach((workers, interval) => {
		if (workers.length >= 2) console.log(interval + " @ " + workers.toString())
	})

});

// Check if interval doesn't already exist in map and append or create new entry
function addInterval(intervalMap, intervalKey, workerId, type) {
	if (intervalMap.has(intervalKey)) {
			updatedId = intervalMap.get(intervalKey).ids.concat(workerId)
			intervalMap.set(intervalKey, {ids: updatedId, type: type})
	} else {
			intervalMap.set(intervalKey, {ids: [workerId], type: type});
	}  
}
