import { useEffect, useState } from "react";


/**
 * 
 * @param  inialTime initial countdown timer in ms
 * @param  callback function to execute when timer reaches 0  
 * @param  interval interval option in ms
 */



export const useCountdown = ( inialTime: number,  callback: () => void, interval: number =1000) => {

  const [timer, setTimer] = useState(inialTime);

  console.log('timer = ' + timer)


  useEffect(() => {
    const customInterval = setInterval(() => {
     if(timer > 0){
       setTimer((prev) => prev - 1)
     } else {
       callback() 
      setTimer(inialTime)
     }
      
      
    

    }, interval);
    
   return () => clearInterval(customInterval)
  }, [timer, inialTime, callback, interval]);


  
  
 return timer
  
}
