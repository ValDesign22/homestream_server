import { IConfig, IFolder } from '../../utils/types/interfaces.util';

const parse_tvshow_filename = (
  filename: string,
): {
  title: string;
  year: string | null;
  season: string;
  episode: string;
} | null => {
  const regex = /^(.*?)\s*(?:\((\d{4})\))?\s*S(\d{2})\s*E(\d{2})$/;
  const match = filename.match(regex);

  if (!match) return null;

  const [_, title, year, season, episode] = match;

  return { title, year, season, episode };
};

export const analyze_tvshows = async (
  folder: IFolder,
  { save_images }: IConfig,
): Promise<void> => {
  // TODO: Implement TV Shows analysis
  return;
};
