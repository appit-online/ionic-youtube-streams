import {UnrecoverableError} from './errors/unrecoverable-error';

export class ValidationService {
  /*
    Validation
   */
  validate(info: any){
    const playErr = this.playError(info.player_response, ['ERROR']);
    const privateErr = this.privateVideoError(info.player_response);
    if (playErr || privateErr) {
      throw playErr || privateErr;
    }

    return info && (
      info.player_response.streamingData || this.isRental(info.player_response) || this.isNotYetBroadcasted(info.player_response)
    );
  }

  playError(player_response: any, statuses: any) {
    const playability = player_response && player_response.playabilityStatus;
    if (playability && statuses.includes(playability.status)) {
      return new Error(playability.reason || (playability.messages && playability.messages[0]));
    }
    return null;
  }

  privateVideoError(player_response: any){
    const playability = player_response && player_response.playabilityStatus;
    if (playability && playability.status === 'LOGIN_REQUIRED' && playability.messages &&
      playability.messages.filter((m: any) => /This is a private video/.test(m)).length) {
      return new UnrecoverableError(playability.reason || (playability.messages && playability.messages[0]));
    } else {
      return null;
    }
  }

  isRental(player_response: any){
    const playability = player_response.playabilityStatus;
    return playability && playability.status === 'UNPLAYABLE' &&
      playability.errorScreen && playability.errorScreen.playerLegacyDesktopYpcOfferRenderer;
  }

  isNotYetBroadcasted(player_response: any){
    const playability = player_response.playabilityStatus;
    return playability && playability.status === 'LIVE_STREAM_OFFLINE';
  }
}

