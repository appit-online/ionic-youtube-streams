import * as urllib from 'url';
import {HTTP} from '@ionic-native/http/ngx';
import {YTubeService} from "./tube.service";
import querystring from "querystring";

export async function searchVideo(this: any, youtubeId: string, sortType: string) {
  const httpClient = new HTTP();
  const tubeService = new YTubeService(httpClient);


  const watchPageURL = tubeService.BASE_URL ;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36',
  };
  const params = {};

  const url = urllib.format({
    protocol: 'https',
    host: "www.youtube.com",
    pathname: "watch",
    query: {
      v: youtubeId,
      hl: 'en',
      bpctr: `${Math.ceil(Date.now() / 1000)}`,
      has_verified: 1,
    },
  });


  // request yt page
  try {
    const response = await httpClient.get(url, params, headers);
    const body = response.data


  // get json from html
  const info = { page: 'watch', player_response: '', response: '', html5player: '' };
  try {
    try {
      info.player_response =
          tubeService.tryParseBetween(body, 'var ytInitialPlayerResponse = ', '}};', '', '}}') ||
          tubeService.tryParseBetween(body, 'var ytInitialPlayerResponse = ', ';var') ||
          tubeService.tryParseBetween(body, 'var ytInitialPlayerResponse = ', ';</script>') ||
          tubeService.findJSON('watch.html', 'player_response', body, /\bytInitialPlayerResponse\s*=\s*\{/i, '</script>', '{', tubeService);
    } catch (_e) {
      const args = tubeService.findJSON('watch.html', 'player_response', body, /\bytplayer\.config\s*=\s*{/, '</script>', '{', tubeService);
      info.player_response = tubeService.findPlayerResponse('watch.html', args, tubeService);
    }

    info.response =
        tubeService.tryParseBetween(body, 'var ytInitialData = ', '}};', '', '}}') ||
        tubeService.tryParseBetween(body, 'var ytInitialData = ', ';</script>') ||
        tubeService.tryParseBetween(body, 'window["ytInitialData"] = ', '}};', '', '}}') ||
        tubeService.tryParseBetween(body, 'window["ytInitialData"] = ', ';</script>') ||
        tubeService.findJSON('watch.html', 'response', body, /\bytInitialData("\])?\s*=\s*\{/i, '</script>', '{', tubeService);
    // @ts-ignore
    info.html5player = tubeService.getHTML5player(body);
  } catch (_) {
    throw Error(
        'Error when parsing watch.html, maybe YouTube made a change: ' + body
    );
  }

  // verify response
  const playErr = tubeService.playError(info.player_response);
  if (playErr) {
    throw playErr;
  }

  // fetch formats and more
  const infoResponse = await tubeService.gotConfig(youtubeId, null, info, tubeService, httpClient);
  return infoResponse
  }catch (e) {
    console.log(e)
  }
}
