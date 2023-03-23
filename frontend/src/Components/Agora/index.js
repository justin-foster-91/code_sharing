//For agora video calls. 
import React, { useEffect, useState } from "react";
import {
  AgoraVideoPlayer,
  createClient,
  createMicrophoneAndCameraTracks,
  ClientConfig,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-react";
import SocketCodeMirror from '../SocketCodeMirror';
import config from '../../config';
import useStyles from '../../styles.js';
import { useHistory, useParams, Prompt } from "react-router-dom";
import TokenService from '../../Services/token-service';
import SeeNoMonkey from '../../Assets/SeeNoMonkey.png';

const agoraConfig = { 
  mode: "rtc", codec: "vp8",
};
let debounceTimer
let debounceWait = 2000;
let spinnerShow = 1000;

const appId = "e47a164284a24bae83839c6898f434d9"; //ENTER APP ID HERE

const AgoraAndText = () => {
  const [inCall, setInCall] = useState(false);
  const [token, setToken] = useState(undefined);
  const [uid, setUid] = useState(undefined);
  const classes = useStyles();
  const { id } = useParams();

  useEffect(()=>{
    fetch(`${config.API_ENDPOINT}/instances/${id}/agora`, {
      method: 'GET',
      headers: {
        'authorization': `Bearer ${TokenService.getAuthToken()}`,
      },
    })
      .then(res =>
        (!res.ok)
        ? res.json().then(e => Promise.reject(e))
        : res.json()
      )
      .then((data)=>{
        setToken(data.token);
        setUid(data.uid);
      })
  },
    [])
  return (
    <div style={{height: '85vh'}}>
      <h1 className="heading">Kitsap Chat</h1>
      {inCall && token ? (
        <VideoCall token={token} setInCall={setInCall} channelName={"instances-" + id} uid={uid} />
      ) : (
        <ChannelForm setInCall={setInCall}/>
      )}
      <SocketCodeMirror/>
    </div>
  );
};

// the create methods in the wrapper return a hook
// the create method should be called outside the parent component
// this hook can be used the get the client/stream in any component
const useClient = createClient(agoraConfig);
const useMicrophoneAndCameraTracks = createMicrophoneAndCameraTracks();

const VideoCall = (props) => {
  const { setInCall, channelName } = props;
  const [users, setUsers] = useState([]);
  const [unpublishedUsers, setUnpublishedUsers] = useState([])
  const [start, setStart] = useState(false);
  // using the hook to get access to the client object
  const client = useClient();
  // ready is a state variable, which returns true when the local tracks are initialized, untill then tracks variable is null
  const { ready, tracks } = useMicrophoneAndCameraTracks();

  const [trackState, setTrackState] = useState({ video: true, audio: true });

  useEffect(() => {
    console.log("USERS: ", users);
    console.log("UNPUBLISHED USERS: ", unpublishedUsers)
    // function to initialise the SDK
    let init = async (name) => {
      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        console.log("subscribe success");
        if (mediaType === "video") {
          setUsers((prevUsers) => {
            return [...prevUsers, user];
          });
          setUnpublishedUsers((prevUsers) => {
            return prevUsers.filter((User) => User.uid !== user.uid);
          });
        }
        if (mediaType === "audio") {
          user.audioTrack?.play();
        }
      });

      client.on("user-unpublished", (user, type) => {
        console.log("unpublished", user, type);
        if (type === "audio") {
          user.audioTrack?.stop();
        }
        if (type === "video") {
          setUnpublishedUsers((prevUsers) => {
            return [...prevUsers, user];
          });
          setUsers((prevUsers) => {
            return prevUsers.filter((User) => User.uid !== user.uid);
          });
        }
      });

      client.on("user-left", (user) => {
        console.log("leaving", user);
        setUnpublishedUsers((prevUsers) => {
          return prevUsers.filter((User) => User.uid !== user.uid);
        });
        setUsers((prevUsers) => {
          return prevUsers.filter((User) => User.uid !== user.uid);
        });
      });

      await client.join(appId, props.channelName, props.token, props.uid);
      if (tracks) await client.publish([tracks[0], tracks[1]]);
      setStart(true);

    };

    if (ready && tracks) {
      console.log("init ready");
      init(channelName);
    }

  }, [channelName, client, ready, tracks]);


  return (
    <div className="App">
      {ready && tracks && (
        <Controls tracks={tracks} setStart={setStart} setInCall={setInCall} trackState={trackState} setTrackState={setTrackState}/>
      )}
      {start && tracks && <Videos users={users} tracks={tracks} trackState={trackState} setTrackState={setTrackState} unpublishedUsers={unpublishedUsers}/>}
    </div>
  );
};

const Videos = (props) => {
  const { users, tracks, trackState, unpublishedUsers } = props;
  

  return (
    <div >
      <div id="videos" style={{display: 'flex', width: "100%", height: "100%", flexShrink: '3', justifyContent: 'center', borderRadius: '20px'}}>
        
        {/* AgoraVideoPlayer component takes in the video track to render the stream,
            you can pass in other props that get passed to the rendered div */}
        {trackState && trackState.video 
          ? <AgoraVideoPlayer style={{display: 'flex', height: '200px', width: '300px', borderRadius: '20px'}} videoTrack={tracks[1]} />
          : <img src={SeeNoMonkey} alt="See No User" style={{display: 'flex', height: '200px', width: '200px', borderRadius: '20px'}} />}
        {users.length > 0 &&
          users.map((user) => {
            if (user.videoTrack) {
              return (
                <AgoraVideoPlayer style={{display: 'flex', height: '200px', width: '300px', borderRadius: '20px'}} videoTrack={user.videoTrack} key={user.uid} />
              );
            } else return null;
          })
        }
        {unpublishedUsers.length > 0 &&
          unpublishedUsers.map((user) => {
            return (
                <img src={SeeNoMonkey} alt="See No User" style={{display: 'flex', height: '200px', width: '200px', borderRadius: '20px'}} />
              );
          })
        }
      </div>
    </div>
  );
};

export const Controls = (props) => {
  const client = useClient();
  const { tracks, setStart, setInCall, trackState, setTrackState } = props;
  // const [trackState, setTrackState] = useState({ video: true, audio: true });

  const mute = async (type) => {
    if (type === "audio") {
      await tracks[0].setEnabled(!trackState.audio);
      setTrackState((ps) => {
        return { ...ps, audio: !ps.audio };
      });
    } else if (type === "video") {
      await tracks[1].setEnabled(!trackState.video);
      setTrackState((ps) => {
        return { ...ps, video: !ps.video };
      });
    }
  };

  const leaveChannel = async () => {
    await client.leave();
    client.removeAllListeners();
    // we close the tracks to perform cleanup
    tracks[0].close();
    tracks[1].close();
    setStart(false);
    setInCall(false);
  };

  return (
    <div className="controls">
      <button className={trackState.audio ? "on" : ""}
        onClick={() => mute("audio")}>
        {trackState.audio ? "MuteAudio" : "UnmuteAudio"}
      </button> 
      <button className={trackState.video ? "on" : ""}
        onClick={() => mute("video")}>
        {trackState.video ? "MuteVideo" : "UnmuteVideo"}
      </button>
      <br/>
      {<button onClick={() => leaveChannel()}>Leave</button>}
    </div>
  );
};

const ChannelForm = (props) => {
  const { setInCall } = props;

  return (
    <form className="join">
      {appId === '' && <p style={{color: 'red'}}>Please enter your Agora App ID in App.tsx and refresh the page</p>}
      <button onClick={(e) => {
        e.preventDefault();
        setInCall(true);
      }}>
        Join
      </button>
      <br/>
    </form>
  );
};

export default AgoraAndText;
