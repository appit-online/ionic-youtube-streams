const jsonClosingChars = /^[)\]}'\s]+/;
const VIDEO_URL = 'https://www.youtube.com/watch?v=';

export class UtilsService {
  VIDEO_URL = VIDEO_URL;

  getHTMLWatchURL(id: any){
    const params = '&hl=en';
    return VIDEO_URL + id + params;
  };

  findPlayerResponse(source: any, info: any){
    // tslint:disable-next-line:variable-name
    const player_response = info && (
      (info.args && info.args.player_response) ||
      info.player_response || info.playerResponse || info.embedded_player_response);
    return this.parseJSON(source, 'player_response', player_response);
  }

  cutAfterJSON(mixedJson: any){
    let open;
    let close;
    if (mixedJson[0] === '[') {
      open = '[';
      close = ']';
    } else if (mixedJson[0] === '{') {
      open = '{';
      close = '}';
    }

    if (!open) {
      throw new Error(`Can't cut unsupported JSON (need to begin with [ or { ) but got: ${mixedJson[0]}`);
    }

    // States if the loop is currently in a string
    let isString = false;

    // Current open brackets to be closed
    let counter = 0;

    let i;
    for (i = 0; i < mixedJson.length; i++) {
      // Toggle the isString boolean when leaving/entering string
      if (mixedJson[i] === '"' && mixedJson[i - 1] !== '\\') {
        isString = !isString;
        continue;
      }
      if (isString) continue;

      if (mixedJson[i] === open) {
        counter++;
      } else if (mixedJson[i] === close) {
        counter--;
      }

      // All brackets have been closed, thus end of JSON is reached
      if (counter === 0) {
        // Return the cut JSON
        return mixedJson.substr(0, i + 1);
      }
    }

    // We ran through the whole string and ended up with an unclosed bracket
    throw Error("Can't cut unsupported JSON (no matching closing bracket found)");
  }

  /*
  * Extract string inbetween another.
  */
  between(haystack: any, left: any, right: any) {
    let pos;
    if (left instanceof RegExp) {
      const match = haystack.match(left);
      if (!match) { return ''; }
      pos = match.index + match[0].length;
    } else {
      pos = haystack.indexOf(left);
      if (pos === -1) { return ''; }
      pos += left.length;
    }
    haystack = haystack.slice(pos);
    pos = haystack.indexOf(right);
    if (pos === -1) { return ''; }
    haystack = haystack.slice(0, pos);
    return haystack;
  }

  parseJSON(source: any, varName: any, json: any){
    if (!json || typeof json === 'object') {
      return json;
    } else {
      try {
        json = json.replace(jsonClosingChars, '');
        return JSON.parse(json);
      } catch (err) {
        throw Error(`Error parsing ${varName} in ${source}: ${err.message}`);
      }
    }
  }

  getHTML5player(body: any){
    const html5playerRes =
      /<script\s+src="([^"]+)"(?:\s+type="text\/javascript")?\s+name="player_ias\/base"\s*>|"jsUrl":"([^"]+)"/
        .exec(body);
    return html5playerRes ? html5playerRes[1] || html5playerRes[2] : null;
  }
}