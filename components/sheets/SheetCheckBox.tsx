import { Svg, Path, Rect } from '@react-pdf/renderer';

const Checkbox = ({ checked }: { checked: boolean }) => (
    <Svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 521 512" height="12" width="12">
        {checked && (
            <Path fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M352 176 217.6 336 160 272"></Path>
        )}
        <Rect width="384" height="384" x="64" y="64" fill="none" stroke-linejoin="round" stroke-width="32" rx="48" ry="48"></Rect>        
    </Svg>
);
export default Checkbox;
