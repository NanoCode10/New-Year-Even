
import { useCountdown } from '../hooks/useCountdown';

export const SecondsBoom = () => {
    
    const initialTime = 5*1000;
 
    const timer  = useCountdown(initialTime, () => alert('BOOM!'));
    
    return <div>The World is going down in <span className='text-red-500 font-bold text-3xl' >{timer / 1000}</span> seconds</div>
}
