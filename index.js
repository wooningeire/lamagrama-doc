const connection = new WebSocket("ws://localhost:8001");

connection.onmessage = event => {
	const commandType = event.data.slice(0, event.data.indexOf(" "));
	const commandRest = event.data.slice(event.data.indexOf(" ") + 1);

	switch (commandType) {
		case "color.solid": {
			const url = new Canvas(50, 50).style(commandRest).cover().toSrc();
			connection.send(`attachmenturl ${url}`);
			break;
		}
		
		case "jpegify": {
			const commandArgs = commandRest.split(" ");

			const image = new Image();

			image.crossOrigin = "anonymous";
			image.addEventListener("load", () => {
				const weightsMatrix = [
					 0, -1,  0,
					-1,  5, -1,
					 0, -1,  0
				];
				const url = new Canvas(image).filterConvolution(weightsMatrix).toSrc("image/jpeg", parseFloat(commandArgs[1]) || .1);
				connection.send(`attachmenturl ${url}`);
			}, { once: true });
			image.src = commandArgs[0];

			break;
		}
		
		case "convolve": {
			const commandArgs = commandRest.split(" ");

			const image = new Image();

			image.crossOrigin = "anonymous";
			image.addEventListener("load", () => {
				try {
					let weights = commandArgs[1].split(",");
					const statementCount = image.width * image.height * weights.length**2;
					const statementLimit = 2**26; // arbitrary limit
					if (statementCount > statementLimit) {
						throw new RangeError(
							`This command call would take ${statementCount.toLocaleString()} steps—such an operation would hold up the command processing. ` +
							`Try downsizing the image first (\`l:scale ${Math.sqrt(statementLimit / statementCount).toFixed(4)}\`).`
						);
					}
	
					const url = new Canvas(image).filterConvolution(weights.map(n => parseFloat(n))).toSrc();
					connection.send(`attachmenturl ${url}`);
				} catch (error) {
					connection.send(`error ${error.message}`);
				}
			}, { once: true });
			image.src = commandArgs[0];

			break;
		}
		
		case "scale": {
			const commandArgs = commandRest.split(" ");

			const image = new Image();

			image.crossOrigin = "anonymous";
			image.addEventListener("load", () => {
				let factor = parseFloat(commandArgs[1]);
				const url = new Canvas(image.width * factor, image.height * factor).imageSmoothing(false).scale(factor).image(image).toSrc();
				connection.send(`attachmenturl ${url}`);
			}, { once: true });
			image.src = commandArgs[0];

			break;
		}

		default:
			console.warn(`Unrecognized command "${commandType}"`);
			break;
	}
};

connection.onclose = () => {
	location.reload(true);
};

addEventListener("beforeunload", () => {
	connection.close();
	return true;
}, false);