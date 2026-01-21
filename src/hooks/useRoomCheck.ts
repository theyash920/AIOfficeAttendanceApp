import { useState, useEffect } from 'react';

export const useRoomCheck = () => {
  const [inRoom, setInRoom] = useState(false);

  useEffect(() => {
    // Logic to check room presence
    setInRoom(false);
  }, []);

  return { inRoom };
};
