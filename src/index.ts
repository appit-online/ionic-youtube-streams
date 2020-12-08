import { searchVideo } from './lib/search';

export const Name = (name: string) => `Hello ${name}`;

export function info(videoId: string) {
  return searchVideo(videoId, 'video');
}

export function sortByType(videoId: string, type: string) {
  return searchVideo(videoId, type);
}
