function main(param) {
	var scene = new g.Scene({game: g.game, assetIds: ["font16_1", "glyph_area_16"]});
	var gameTimeLimit = 60;	// デフォルトを60秒にする
	var frameCount = 0;	// 経過時間をフレーム単位で記録
	// ゲームスコアの初期化
	g.game.vars.gameState = {
		score: 0
	};

	scene.message.add(function(msg) {
		if (msg.data && msg.data.type === "start" && msg.data.parameters && msg.data.parameters.gameTimeLimit) {
			// 制限時間を通知するイベントを受信した時点で初期化する
			// タイトル、チュートリアル、スコア発表などが無く尺があまるため、25秒多めにとる
			gameTimeLimit = msg.data.parameters.gameTimeLimit + 25;
		}
	});

	scene.loaded.add(function() {
		// glyphとfontを指定
		var glyph = JSON.parse(scene.assets["glyph_area_16"].data);
		var font = new g.BitmapFont({
			src: scene.assets["font16_1"],
			map: glyph,
			defaultGlyphWidth: 16,
			defaultGlyphHeight: 16
		});
		// スコア表示用ラベルを配置
		var scoreLabel = new g.Label({
			scene: scene,
			font: font,
			fontSize: 16,
			text: "" + g.game.vars.gameState.score,
			x: g.game.width - 16 * 10,	// 右端に10文字くらい表示できるように配置
			y: 0
		});
		scene.append(scoreLabel);

		// 時間表示用ラベルを配置
		var timerLabel = new g.Label({
			scene: scene,
			font: font,
			fontSize: 16,
			text: "",
			x: 0,	// 左端に配置
			y: 0
		});
		scene.append(timerLabel);

		function updateTimerLabel() {
			var s = countDown();
			var text = s / 10 + (s % 10 === 0 ? ".0" : "");
			if (timerLabel.text != text) {
				timerLabel.text = text;
				timerLabel.invalidate();
			}
		}
		function updateScoreLabel() {
			scoreLabel.text = "" + g.game.vars.gameState.score;
			scoreLabel.invalidate();
		}
		function countDown() {
			return Math.floor(gameTimeLimit * 10 - frameCount / g.game.fps * 10);
		}
		var places = [];
		var placeContainer = new g.E({
			scene: scene,
			x: (g.game.width - 5 * 64) / 2,
			y: 100
		});
		scene.append(placeContainer);

		// ランダムに1文字選ぶ処理
		function pickAlpha() {
			switch (g.game.random.get(0, 4)) {
				case 0:
				return "A";
				case 1:
				return "B";
				case 2:
				return "C";
				case 3:
				return "D";
				case 4:
				return "E";
				default:
				throw new Error("invalid random number");
			}
		}
		function calculateScore(bonus) {
			return 10 * bonus;
		}
		function breakAlpha(e) {
			for (var i = 0; i < places.length; i++) {
				// 一つでも空きスペースがあれば処理を中断
				if (places[i].tag.text === "") return;
			}
			var targetText = e.target.tag.text;
			var bonusCount = 1;
			for (var i = 0; i < places.length; i++) {
				if (places[i].tag.text == targetText) {
					// テキストが合致したら壊す
					updatePlaceText(places[i], "");
					// スコアを連鎖回数分加算
					g.game.vars.gameState.score += calculateScore(bonusCount++);
					updateScoreLabel();
				}
			}
		}
		function updatePlaceText(place, text) {
			// 内部のデータを更新する
			place.tag.text = text;
			// children[0]はLabelなので、Labelのtextも更新する
			place.children[0].text = text;
			place.children[0].invalidate();
		}
		// 置き場所を作る処理
		function createPlace(index) {
			var label = new g.Label({
				scene: scene,
				font: font,
				fontSize: 48,
				text: "",
				x: 8,
				y: 8
			});
			var place = new g.FilledRect({
				scene: scene,
				x: index % 5 * 64,
				y: Math.floor(index / 5) * 64,
				width: 64,
				height: 64,
				tag: {
					text: ""
				},
				cssColor: index % 2 === 0 ? "#ccc" : "#ddd",
				touchable: true
			});
			place.append(label);
			place.pointDown.handle(breakAlpha);
			return place;
		}
		// 10個の場所を作る
		for (var i = 0; i < 10; i++) {
			var place = createPlace(i);
			placeContainer.append(place);
			places.push(place);
		}
		function visitAlpha() {
			places.forEach(function(place) {
				// テキストが空のもののみ更新をかける
				if (place.tag.text === "") {
					updatePlaceText(place, pickAlpha());
				}
			});
		}
		function tryVisitAlpha() {
			// 1秒に1回
			if (frameCount % g.game.fps === 0) {
				visitAlpha();
			}
		}

		function updateHandler() {
			// フレーム数を毎フレーム加算
			++frameCount;
			if (countDown() <= 0) {
				scene.update.remove(updateHandler);	// タイムアウトになったら毎フレーム処理自体を止める
				// 終了後はタップできないよう、テキストを空にしておく
				places.forEach(function(place) {
					updatePlaceText(place, "");
				});
			}
			tryVisitAlpha();
			updateTimerLabel();
		}
		scene.update.add(updateHandler);
	});

	g.game.pushScene(scene);
}

module.exports = main;
