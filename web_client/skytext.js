(function() {

  window.SkyText = (function() {

    SkyText.prototype.piOver180 = Math.PI / 180;

    SkyText.prototype.latFactor = 0.00001;

    SkyText.prototype.fontHeight = 5;

    function SkyText(lat, lon, alt, o) {
      var lonRatio;
      this.lat = lat;
      this.lon = lon;
      this.alt = alt;
      if (o == null) o = {};
      if (o.lineWidth == null) o.lineWidth = 1;
      if (o.colour == null) o.colour = 'ffffffff';
      this.allCoordSets = [];
      this.lineOpts = [];
      if (o.lineWidth > 0) {
        this.allCoordSets.push([[[this.lon, this.lat, 0], [this.lon, this.lat, this.alt]]]);
        this.lineOpts.push(o);
      }
      lonRatio = 1 / Math.cos(this.lat * this.piOver180);
      this.lonFactor = this.latFactor * lonRatio;
    }

    SkyText.prototype.text = function(text, o) {
      var line, _i, _len, _ref, _results;
      _ref = text.split("\n");
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        line = _ref[_i];
        _results.push(this.line(line, o));
      }
      return _results;
    };

    SkyText.prototype.line = function(text, o) {
      var absX, alt, bRad, char, coords, cosB, i, lat, latFactor, latStart, lineCoordSets, lon, lonFactor, lonStart, maxX, path, paths, sinB, tabWidth, x, xCursor, y, _i, _j, _len, _len2, _ref, _ref2;
      if (o == null) o = {};
      if (o.bearing == null) o.bearing = 0;
      if (o.size == null) o.size = 2;
      if (o.lineWidth == null) o.lineWidth = 2;
      if (o.colour == null) o.colour = 'ffffffff';
      if (o.lineSpace == null) o.lineSpace = 1;
      if (o.charSpace == null) o.charSpace = 1;
      if (o.spaceWidth == null) o.spaceWidth = 2;
      if (o.tabSpaces == null) o.tabSpaces = 4;
      if (o.offset == null) o.offset = 5;
      if (o.font == null) o.font = window.font;
      bRad = o.bearing * this.piOver180;
      sinB = Math.sin(bRad);
      cosB = Math.cos(bRad);
      latFactor = sinB * o.size * this.latFactor;
      lonFactor = cosB * o.size * this.lonFactor;
      latStart = this.lat + sinB * o.offset * this.latFactor;
      lonStart = this.lon + cosB * o.offset * this.lonFactor;
      xCursor = 0;
      tabWidth = o.tabSpaces * o.spaceWidth;
      lineCoordSets = [];
      _ref = text.split('');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        char = _ref[_i];
        if (char === " " || char === "\n" || char === "\r") {
          xCursor += o.spaceWidth;
          continue;
        }
        if (char === "\t") {
          xCursor = Math.ceil((xCursor + 1) / tabWidth) * tabWidth;
          continue;
        }
        paths = (_ref2 = o.font[char]) != null ? _ref2 : o.font['na'];
        maxX = 0;
        for (_j = 0, _len2 = paths.length; _j < _len2; _j++) {
          path = paths[_j];
          coords = (function() {
            var _len3, _results, _step;
            _results = [];
            for (i = 0, _len3 = path.length, _step = 2; i < _len3; i += _step) {
              x = path[i];
              y = path[i + 1];
              if (x > maxX) maxX = x;
              absX = xCursor + x;
              lat = latStart + absX * latFactor;
              lon = lonStart + absX * lonFactor;
              alt = this.alt - (y * o.size);
              _results.push([lon, lat, alt]);
            }
            return _results;
          }).call(this);
          lineCoordSets.push(coords);
        }
        xCursor += maxX + o.charSpace;
      }
      this.alt -= (o.size * this.fontHeight) + o.lineSpace;
      this.lineOpts.push(o);
      this.allCoordSets.push(lineCoordSets);
      return this;
    };

    SkyText.prototype.kml = function() {
      var coordStr, coordStrs, coords, i, k, lineCoordSets, lineCoords, o;
      k = [];
      k.push("<?xml version='1.0' encoding='UTF-8'?><kml xmlns='http://www.opengis.net/kml/2.2'><Document>");
      coordStrs = (function() {
        var _len, _ref, _results;
        _ref = this.allCoordSets;
        _results = [];
        for (i = 0, _len = _ref.length; i < _len; i++) {
          lineCoordSets = _ref[i];
          o = this.lineOpts[i];
          k.push("<Style id='l" + i + "'><LineStyle><color>" + o.colour + "</color><width>" + o.lineWidth + "</width></LineStyle></Style>");
          _results.push((function() {
            var _i, _len2, _results2;
            _results2 = [];
            for (_i = 0, _len2 = lineCoordSets.length; _i < _len2; _i++) {
              lineCoords = lineCoordSets[_i];
              coordStr = ((function() {
                var _j, _len3, _results3;
                _results3 = [];
                for (_j = 0, _len3 = lineCoords.length; _j < _len3; _j++) {
                  coords = lineCoords[_j];
                  _results3.push(coords.join(','));
                }
                return _results3;
              })()).join(' ');
              _results2.push(k.push("<Placemark>          <styleUrl>#l" + i + "</styleUrl>          <LineString><altitudeMode>absolute</altitudeMode><coordinates>" + coordStr + "</coordinates></LineString>        </Placemark>"));
            }
            return _results2;
          })());
        }
        return _results;
      }).call(this);
      k.push("</Document></kml>");
      return k.join('');
    };

    return SkyText;

  })();

}).call(this);
