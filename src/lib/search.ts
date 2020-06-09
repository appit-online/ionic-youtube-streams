import * as urllib from 'url';
import {YTubeService} from './tube.service';
import {CiphService} from './cip.service';
import {HTTP} from '@ionic-native/http/ngx';


const mergeFormats = (info: any, formatsMap: any) => {
  info.formats.forEach((f: any) => {
    formatsMap[f.itag] = f;
  });
  info.formats = Object.values(formatsMap);
};

export async function searchVideo(youtubeId: string) {
  const httpClient = new HTTP();

  const tubeService = new YTubeService(httpClient);
  const ciphService = new CiphService(httpClient);

  const params = 'hl=en';

  const ytApi = tubeService.VIDEO_URL + youtubeId + '&pbj=1&' + params +
    '&bpctr=' + Math.ceil(Date.now() / 1000);

  const response = await httpClient.get(ytApi, {}, {
    'User-Agent': '',
    'x-youtube-client-name': '1',
    'x-youtube-client-version': '2.20191008.04.01',
  });
  const body = response.data;

  let info;
  try {
    info = JSON.parse(body).reduce((part: any, curr: any) => Object.assign(curr, part), {});
  } catch (err) {
    throw Error(`Error parsing info: ${err.message}`);
  }

  let playErr = tubeService.playError(info, 'ERROR');
  if (playErr) {
    throw playErr;
  }

  if (!info.player) {
    // If the video page doesn't work, maybe because it has mature content.
    // and requires an account logged in to view, try the embed page.
    const url = tubeService.EMBED_URL + youtubeId + '?hl=en';
    const responseEmbeded = await httpClient.get(url, {}, {});
    const jsonStr = tubeService.between(responseEmbeded.data, 't.setConfig({\'PLAYER_CONFIG\': ', '</script>');
    let config;
    if (!jsonStr) {
      throw Error('Could not find player config');
    }

    try {
      config = JSON.parse(tubeService.cutAfterJSON(jsonStr));
    } catch (err) {
      throw Error(`Error parsing config: ${err.message}`);
    }

    // @ts-ignore
    playErr = tubeService.playError(info, 'LOGIN_REQUIRED');
    if (!config.args.player_response && !config.args.embedded_player_response && playErr) {
      throw playErr;
    }
    // @ts-ignore
    info.player = config;

  }
  const infoResponse = await tubeService.gotConfig(youtubeId, null, info, body);

  if (infoResponse.formats.length > 0) {
    const html5playerfile = urllib.resolve(tubeService.VIDEO_URL, infoResponse.html5player);
    const tokens = await ciphService.getTokens(html5playerfile);

    ciphService.decipherFormats(infoResponse.formats, tokens, false);
    const funcs: any[] = [];

    tubeService.parallel(funcs, (err: any, results: any) => {
      if (results[0]) { mergeFormats(infoResponse, results[0]); }
      if (results[1]) { mergeFormats(infoResponse, results[1]); }

      infoResponse.full = true;
    });
    return infoResponse;
  } else {
    return null;
  }
}
