//This is actually the instance. 
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import InstanceApiService from "../../Services/instance-api-service";
import Agora from "../Agora/index.js";

//Hacky, for now.  We'll just import all possible views here.  Later, will need to do this more dynamically (because the compiled React code will get too big/slow if we have 1000s of possible views compiled in)
import { Chessboard } from "react-chessboard";
import { Chess as ChessGame } from "chess.js";

const Chess = (props) => {
  const [game, setGame] = useState(new ChessGame(props.data));
  console.log(game.fen());

  return (
    <Chessboard
      position={game.fen()}
      getPositionObject={console.log}
      onPieceDrop={(sourceSquare, targetSquare) => {
        const gameCopy = { ...game };
        const move = gameCopy.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });

        //Rather than setting the game directly here, we should update the
        //  underlying data in the backend.  Look at how this is done from the
        //  instance details text editor
        setGame(gameCopy);
      }}
    />
  );
};

const VideoCall = (props) => {
  return <Agora />;
};

const CustomView = (props) => {
  const { id, view_id } = useParams();
  const [instanceData, setInstanceData] = useState(undefined);
  const [error, setError] = useState(null);

  useEffect(() => {
    InstanceApiService.getInstanceById(id)
      .then((instance) => {
        setInstanceData(instance.text);
      })
      .catch((res) => {
        setError(res.error);
      });
  }, [view_id]);

  if (view_id == "chess" && instanceData) return <Chess data={instanceData} />;
  else if (view_id === "video-call" && instanceData)
    return <VideoCall data={instanceData} />;
  else
    return (
      <>
        <h1>No view selected... But here's your data!</h1>
        <p>{instanceData}</p>
      </>
    );
};

export default CustomView;
