import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

export default function Check(props: React.ComponentProps<typeof Svg>) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M10.1286 17.5046L10.9241 16.7091L9.33315 15.1181L6.0455 11.8305C5.60616 11.3911 4.89384 11.3911 4.4545 11.8305C4.01516 12.2698 4.01517 12.9821 4.45451 13.4215L8.53765 17.5046C8.97699 17.944 9.6893 17.944 10.1286 17.5046Z"
        stroke="#fff"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        opacity={0.4}
        d="M19.5444 8.08749C19.9837 7.64815 19.9837 6.93584 19.5444 6.4965C19.105 6.05716 18.3927 6.05716 17.9534 6.4965L9.33203 15.1179L10.923 16.7088L19.5444 8.08749Z"
        stroke="#fff"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}