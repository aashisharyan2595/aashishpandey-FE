import React from 'react';
import { Composition } from 'remotion';
import { Video, calcMeta } from './Video';
import { Thumb } from './Thumb';
const empty = { v: { scenes: [{ type: 'hook', say: 'Hello.' }], thumbs: [{ text: ['HELLO'] }] }, tl: { total: 2, scenes: [{ sentences: [{ text: 'Hello.', start: 0, vend: 1, end: 1.3 }] }] } };
export const Root: React.FC = () => (<>
  <Composition id="Video" component={Video as any} durationInFrames={60} fps={30} width={1080} height={1920} defaultProps={empty as any} calculateMetadata={calcMeta as any} />
  <Composition id="Thumb" component={Thumb as any} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{ ...empty, k: 0 } as any} />
  <Composition id="ThumbWide" component={Thumb as any} durationInFrames={1} fps={30} width={1280} height={720} defaultProps={{ ...empty, k: 0, wide: true } as any} />
</>);
