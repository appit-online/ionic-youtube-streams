import {HTTP} from '@ionic-native/http/ngx';
import { ValidationService } from './validation.service';
import { WatchJsonService } from './functions/watch-json.service';
import { WatchHtmlService } from './functions/watch-html.service';
import { VideoInfoService } from './functions/video-info.service';
import {UnrecoverableError} from './errors/unrecoverable-error';


export class BasicInfoService {

  retryOptions = {
    maxRedirects: 10,
    maxRetries: 0,
    maxReconnects: 0,
    backoff: { inc: 100, max: 10000 },
  };

  constructor(public httpClient: HTTP) {
  }

  async getBasicInfo(id: any, options: any) {
    const watchJsonService = new WatchJsonService(this.httpClient);
    const watchHtmlService = new WatchHtmlService(this.httpClient);
    const videoInfoService = new VideoInfoService(this.httpClient);

    const info = await this.pipeline([id, options], this.retryOptions, [
      watchJsonService.getJSONWatchPage,
      watchHtmlService.getWatchHTMLPage,
      videoInfoService.getVideoInfoPage
    ], this.httpClient);

    Object.assign(info, {
      formats: this.parseFormats(info.player_response),
    });

    const additional = {
      // Give the standard link to the video.
      video_url: 'https://www.youtube.com/watch?v=' + id,
    };

    info.videoDetails = Object.assign({},
      info.player_response && info.player_response.microformat &&
      info.player_response.microformat.playerMicroformatRenderer,
      info.player_response && info.player_response.videoDetails, additional);

    return info;
  }

  parseFormats(playerResponse: any){
    let formats: any[] = [];
    if (playerResponse.streamingData) {
      formats = formats
        .concat(playerResponse.streamingData.formats || [])
        .concat(playerResponse.streamingData.adaptiveFormats || []);
    }
    return formats;
  }


  /**
   * Goes through each endpoint in the pipeline, retrying on failure if the error is recoverable.
   * If unable to succeed with one endpoint, moves onto the next one.
   *
   * @param {Array.<Object>} args
   * @param {Function} validate
   * @param {Object} retryOptions
   * @param {Array.<Function>} endpoints
   * @returns {[Object, Object, Object]}
   */
  async pipeline(args: any, retryOptions: any, endpoints: any, httpClient: any){
    const validationService = new ValidationService();

    let info;
    for (const func of endpoints) {
      try {
        const newInfo: any = await this.retryFunc(func, args, retryOptions, httpClient);
        newInfo.player_response.videoDetails = this.assign(info && info.player_response
          && info.player_response.videoDetails,
          newInfo.player_response.videoDetails);
        newInfo.player_response = this.assign(info && info.player_response, newInfo.player_response);

        info = this.assign(info, newInfo);
        if (validationService.validate(info)) {
          break;
        }

      } catch (err) {
        if (err instanceof UnrecoverableError || func === endpoints[endpoints.length - 1]) {
          throw err;
        }else{
          // tslint:disable-next-line:no-console
          console.log(err);
        }
        // Unable to find video metadata... so try next endpoint.
      }
    }
    return info;
  }

  /**
   * Given a function, calls it with `args` until it's successful,
   * or until it encounters an unrecoverable error.
   * Currently, any error from miniget is considered unrecoverable. Errors such as
   * too many redirects, invalid URL, status code 404, status code 502.
   *
   * @param {Function} func
   * @param {Array.<Object>} args
   * @param {Object} options
   * @param {number} options.maxRetries
   * @param {Object} options.backoff
   * @param {number} options.backoff.inc
   */
  async retryFunc(func: any, args: any, retryOptions: any, httpClient: any){
    let currentTry = 0;
    let result;
    while (currentTry <= retryOptions.maxRetries) {
      try {
        result = await func(...args, httpClient);
        break;
      } catch (err) {
        if (err instanceof UnrecoverableError ||
          (err && err.statusCode < 500) || currentTry >= retryOptions.maxRetries) {
          throw err;
        }else{
          // tslint:disable-next-line:no-console
          console.log(err);
        }
        const wait = Math.min(++currentTry * retryOptions.backoff.inc, retryOptions.backoff.max);
        await new Promise(resolve => setTimeout(resolve, wait));
      }
    }
    return result;
  }

  /**
   * Like Object.assign(), but ignores `null` and `undefined` from `source`.
   *
   * @param {Object} target
   * @param {Object} source
   * @returns {Object}
   */
  assign(target: any, source: any){
    if (!target || !source) { return target || source; }
    for (const [key, value] of Object.entries(source)) {
      if (value !== null && value !== undefined) {
        target[key] = value;
      }
    }
    return target;
  }
}

