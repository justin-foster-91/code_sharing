//Display for individual instance
import React, { useEffect, useState } from "react";
import { useHistory, useParams, Prompt } from "react-router-dom";
import TokenService from '../../Services/token-service';
import config from '../../config';
import Title from './Title';
import TextField from '@material-ui/core/TextField';
import CircularProgress from '@material-ui/core/CircularProgress';
import IconButton from '@material-ui/core/IconButton';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import InstanceApiService from '../../Services/instance-api-service';
import CollaboratorApiService from '../../Services/collaborator-api-service';
import Chip from '@material-ui/core/Chip';
import LockIcon from '@material-ui/icons/Lock';
import useStyles from '../../styles.js';
import CheckIcon from '@material-ui/icons/Check';
import CodeMirror from 'codemirror';
import {UnControlled as ReactCodeMirror} from 'react-codemirror2';
import 'codemirror/addon/edit/matchbrackets.js'
import 'codemirror/addon/edit/closebrackets.js'
import 'codemirror/addon/selection/active-line.js'
import CallSplitIcon from '@material-ui/icons/CallSplit';
import {socket} from '../../Context/socket';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormHelperText from '@mui/material/FormHelperText';

let debounceTimer;
let changeTimer;

export default function InstanceDetails(props) {
  const classes = useStyles();
  let history = useHistory();

  const [instance, setInstance] = useState();
  const [isSaving, setIsSaving] = useState(false);
  // FIXME: CodeMirror re-render workaround. Needs revision
  const [instanceText, setInstanceText] = useState(undefined);
  const [open, setOpen] = React.useState(false);
  const [instanceToDelete, setInstanceToDelete] = React.useState(undefined);
  const [value, setValue] = React.useState("");
  const [inputValue, setInputValue] = React.useState("");
  const [instanceTag, setInstanceTag] = useState("");
  const [instanceCollaborator, setInstanceCollaborator] = useState('');
  const [collaboratorPermission, setCollaboratorPermission] = useState(null)
  const [permissionError, setPermissionError] = useState(false)
  const [userOwnsInstance, setUserOwnsInstance] = useState()
  const [error, setError] = useState(null);
  const [fillStuff, setFillStuff] = useState(false);
  const [collaboratorErrorText, setCollaboratorErrorText] = useState("")
  const [previousText, setPreviousText] = useState("");

  let debounceWait = 1000;
  let spinnerShow = 1000;

  const handleClickOpen = (id) => {
    setInstanceToDelete(id);
  };

  const handleClose = (id) => {
    setInstanceToDelete(undefined);
  };

  const { id } = useParams();
  const path = window.location.pathname;

  useEffect(() => {
    socket.removeAllListeners("UPDATE instance/" + id);
    socket.on("UPDATE instance/" + id, (args) => {
      console.log("Updating instance " + id + " with new text: " + args);
      setInstanceText(args);
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    InstanceApiService.checkForInstanceOwnership(id).then((res) => {
      setUserOwnsInstance(res.userOwnsInstance);
    });

    InstanceApiService.getInstanceById(id)
      .then((instance) => {
        if (isMounted) {
          setInstance(instance);
          setInstanceText(instance.text);
        }
      })
      .catch((res) => {
        setError(res.error);
      });
    return () => {
      isMounted = false;
    };
  }, [path, id]);

  const debounce = (func, delay) => {
    // setIsSaving(true);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func(), delay);
  };

  const tagWhitelist = [
    { title: "Fire" },
    { title: "Ice" },
    { title: "Water" },
    { title: "Deception" },
    { title: "Plant" },
    { title: "Rock" },
    { title: "Pet" },
    { title: "Parasite" },
    { title: "Electric" },
    { title: "Attack" },
    { title: "Heal" },
  ];

  const updateInstance = (instance) => {
    console.log("FRONT TEXT: ", instance.text);
    setIsSaving(true);
    let payload = instance;

    return fetch(`${config.API_ENDPOINT}/instances/${id}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        authorization: `bearer ${TokenService.getAuthToken()}`,
      },
      body: JSON.stringify(payload),
    })
      .then((res) =>
        !res.ok ? res.json().then((e) => Promise.reject(e)) : res.json()
      )
      .then((instance) => {
        setTimeout(() => {
          setIsSaving(false);
        }, spinnerShow);
        // setIsSaving(false)
        // setInstance(instance)
      });
  };

  function deleteInstances(id) {
    return fetch(`${config.API_ENDPOINT}/instances/${id}`, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        authorization: `bearer ${TokenService.getAuthToken()}`,
      },
    }).then((res) =>
      !res.ok ? res.json().then((e) => Promise.reject(e)) : res.json()
    );
  }

  function addTagToInstance(id, tag) {
    return fetch(`${config.API_ENDPOINT}/instances/${id}/tags/${tag}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `bearer ${TokenService.getAuthToken()}`,
      },
    })
      .then((res) =>
        !res.ok ? res.json().then((e) => Promise.reject(e)) : res.json()
      )
      .then((tag) => {
        setIsSaving(false);
        setInstance({ ...instance, tags: [...instance.tags, tag] });
      });
  }

  //Press enter to save tag
  function handleTagKeyUp(event) {
    if (event.keyCode === 13 && instanceTag) {
      addTagToInstance(instance.id, instanceTag);
      setInstanceTag("");
    }
  }

  function handleCollaboratorKeyUp(event) {
      if(event.keyCode === 13 && instanceCollaborator) {
        if (collaboratorPermission != null) {
          CollaboratorApiService.postCollaboratorsByInstance(instance.id, instanceCollaborator, collaboratorPermission)
          .then((collaborator) => {
            setCollaboratorErrorText("")
            console.log("COLLABORATOR THING: ", instanceCollaborator)
            console.log("COLLABORATOR LIST: ", instance.collaborators);
            setPermissionError(false);
            setFillStuff(!fillStuff);
            setInstanceCollaborator("")
            // setInstance({...instance, collaborators:[...instance.collaborators, instanceCollaborator]})
          })
          .catch(res => {
            setCollaboratorErrorText(res.error)
            setError(res.error);
            setPermissionError(true);
            console.log("catch: ")
            console.log(res.error)
          })
        } else {
          setPermissionError(true);
          setCollaboratorErrorText("You must select a permission level.")
          console.log('null collaboratorPermission: you must select a permission level')
        }
      } 
  }

  function removeTagFromInstance(id, tag_name) {
    return fetch(`${config.API_ENDPOINT}/instances/${id}/tags/${tag_name}`, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        authorization: `bearer ${TokenService.getAuthToken()}`,
      },
    })
      .then((res) =>
        !res.ok ? res.json().then((e) => Promise.reject(e)) : res.json()
      )
      .then((tag) => {
        setIsSaving(false);
        setInstance({
          ...instance,
          tags: instance.tags.filter((t) => {
            return t.name !== tag_name;
          }),
        });
      });
  }

  const removeCollaboratorFromInstance = (instID, userID) => {
    CollaboratorApiService.deleteCollaboratorsByInstance(instID, [userID]).then(
      (collaborator) => {
        setInstance({
          ...instance,
          collaborators: instance.collaborators.filter((c) => {
            return c.user_id !== userID;
          }),
        });
      }
    );
  };

  const clickForkIcon = (id) => {
    InstanceApiService.forkInstanceById(id).then((instance) => {
      history.push(`/instances/${instance.id}`);
    });
  };

  const handlePermissionChange = (event) => {
    const newPermission = event.target.value;
    setCollaboratorPermission(newPermission);
    setValue(newPermission);
    console.log(newPermission);
    document.getElementById("collaboratorTextField").focus();
  };

  const handleCollaborator = (event) => {
    setInstanceCollaborator(event.target.value);
  };

  return (
    <>
      <Prompt when={isSaving} message="Instance is not saved yet" />
      {instance ? (
        <div className={instance.locked ? classes.instanceDetailsLocked : ""}>
          <div className={classes.titleRow}>
            <div className={classes.metaID}>ID: {instance.id}</div>
            <div className={classes.metaTitle}>
              <Title>{instance.name}</Title>
            </div>
            <div className={classes.metaSpinner}>
              {instance.locked || !userOwnsInstance ? (
                ""
              ) : isSaving ? (
                <div className={classes.spinner}>
                  <CircularProgress size={30} />
                </div>
              ) : (
                <div className={classes.spinner}>
                  <CheckIcon />
                </div>
              )}
            </div>
          </div>
          <p></p>
          <div className={classes.iconRow}>
            {instance.locked || !userOwnsInstance ? (
              <TextField
                className={classes.instanceDetailsTitle}
                label="Name"
                defaultValue={instance.name}
                disabled
              />
            ) : (
              <TextField
                className={classes.instanceDetailsTitle}
                label="Name"
                defaultValue={instance.name}
                onChange={(event) => {
                  setInstance({ ...instance, name: event.target.value });
                  setTimeout(() => {
                    debounce(
                      () =>
                        updateInstance({
                          ...instance,
                          name: event.target.value,
                        }),
                      debounceWait
                    );
                  }, 500);
                }}
              />
            )}
            <div className={classes.instanceDetailsImage}>
              <img
                src="https://i.imgur.com/VE9Aksf.jpg"
                alt="Instance Image"
                width="40%"
              ></img>
            </div>
            <div className={classes.iconBox}>
              {instance.locked || !userOwnsInstance ? (
                <div className={classes.instanceDetailsIcons}>
                  <Tooltip title="Instance Locked" placement="top">
                    <IconButton>
                      <LockIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Fork Instance" placement="top-end">
                    <IconButton onClick={() => clickForkIcon(instance.id)}>
                      <CallSplitIcon />
                    </IconButton>
                  </Tooltip>
                </div>
              ) : (
                <div className={classes.instanceDetailsIcons}>
                  <Tooltip title="Fork Instance" placement="top">
                    <IconButton onClick={() => clickForkIcon(instance.id)}>
                      <CallSplitIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Public status" placement="top-end">
                    <IconButton
                      aria-label="isPublic"
                      onClick={() => {
                        setInstance({
                          ...instance,
                          is_public: !instance.is_public,
                        });
                        debounce(
                          () =>
                            updateInstance({
                              ...instance,
                              is_public: !instance.is_public,
                            }),
                          debounceWait
                        );
                      }}
                    >
                      {instance.is_public ? (
                        <VisibilityIcon />
                      ) : (
                        <VisibilityOffIcon />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete" placement="top-end">
                    <IconButton
                      aria-label="delete"
                      onClick={() => handleClickOpen(instance.id)}
                    >
                      <DeleteForeverIcon />
                    </IconButton>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
          {/* Delete Instance dialog confirmation */}
          <Dialog
            open={instanceToDelete === instance.id}
            onClose={() => handleClose(instance.id)}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">
              {"Delete instance?"}
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                Are you sure you would like to delete this instance?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  handleClose();
                  deleteInstances(instance.id);
                  history.push("/instances");
                }}
                color="secondary"
              >
                Delete
              </Button>
              <Button onClick={handleClose} color="primary" autoFocus>
                Keep
              </Button>
            </DialogActions>
          </Dialog>
          <div className={classes.iconRow}>
            {instance.locked || !userOwnsInstance ? (
              <TextField
                className={classes.instanceDetailsDescription}
                label="Description"
                defaultValue={instance.description}
                disabled
              />
            ) : (
              <TextField
                className={classes.instanceDetailsDescription}
                label="Description"
                defaultValue={instance.description}
                onChange={(event) => {
                  setInstance({ ...instance, description: event.target.value });
                  setTimeout(() => {
                    debounce(
                      () =>
                        updateInstance({
                          ...instance,
                          description: event.target.value,
                        }),
                      debounceWait
                    );
                  }, 500);
                }}
              />
            )}
          </div>
          <p></p>
          <div className={classes.iconRow}>
            {instance.lock || !userOwnsInstance ? (
              <TextField
                className={classes.tagLine}
                placeholder="Tag"
                value={instanceTag}
                label="Tags"
                disabled
              />
            ) : (
              <TextField
                className={classes.tagLine}
                placeholder="Tag"
                onKeyUp={handleTagKeyUp}
                value={instanceTag}
                label="Tags"
                onChange={(event) => {
                  setInstanceTag(event.target.value);
                }}
              />
            )}
          </div>
          {instance.locked || !userOwnsInstance ? (
            <div className={classes.icon}>
              {instance.tags.map((t) => (
                <Chip
                  key={t.id}
                  variant="outlined"
                  size="small"
                  label={t.name}
                />
              ))}
            </div>
          ) : (
            <div className={classes.icon}>
              {instance.tags.map((t) => (
                <Chip
                  key={t.id}
                  variant="outlined"
                  size="small"
                  label={t.name}
                  onDelete={() => removeTagFromInstance(instance.id, t.name)}
                />
              ))}
            </div>
          )}

          <p></p>

        {/* <div className={classes.iconRow}>
          {instance.lock || !userOwnsInstance ?
            <TextField className={classes.collaboratorLine}
              placeholder="Collaborators"
              value = {instanceCollaborator}
              label="Collaborators"
              disabled
            /> :
            permissionError ? 
              <FormControl>
                <TextField 
                  id={"collaboratorTextField"}
                  className={classes.tagLine}
                  error
                  placeholder="GrandMage327"
                  onKeyUp={handleCollaboratorKeyUp}
                  value = {instanceCollaborator}
                  label="New Collaborator"
                  onChange={handleCollaborator}
                />
                <FormHelperText id="component-error-text">{collaboratorErrorText}</FormHelperText>
              </FormControl> :
              <TextField 
                  id={"collaboratorTextField"}
                  className={classes.tagLine}
                  placeholder="GrandMage327"
                  onKeyUp={handleCollaboratorKeyUp}
                  value = {instanceCollaborator}
                  label="New Collaborator"
                  onChange={handleCollaborator}
                />
            }
          
          <FormControl className={classes.iconRow}>
            <FormLabel id="radio-permission-buttons" style={{ fontSize: '.8rem' }}>Permission</FormLabel>
            <RadioGroup
              row
              aria-labelledby="radio-permission-buttons"
              name="row-radio-buttons-group"
              value={value}
              onChange={handlePermissionChange}
            >
              <FormControlLabel value="Read" control={<Radio size="small" />} label="Read" />
              <FormControlLabel value="ReadWrite" control={<Radio size="small"/>} label="Read/Write" />
            </RadioGroup>
          </FormControl>
        </div> */}

        {instance.locked || !userOwnsInstance ? (
            <div className={classes.icon}>
              {instance.collaborators?.map((collaborator) => (
                <Chip
                  key={collaborator.id}
                  variant="outlined"
                  size="small"
                  label={collaborator.name}
                />
              ))}
            </div>
          ) : (
            <div className={classes.icon}>
              {instance.collaborators?.map((collaborator) => (
                <Chip
                  key={collaborator.id}
                  variant="outlined"
                  size="small"
                  label={collaborator.name}
                  // onDelete={() => CollaboratorApiService.deleteCollaboratorsByInstance(instance.id, collaborator.name)}
                  onDelete={() =>
                    removeCollaboratorFromInstance(
                      instance.id,
                      collaborator.user_id
                    )
                  }
                />
              ))}
            </div>
          )}

          <p></p>
          <div className={classes.instanceDetailsCodeMirror}>
            {instance.locked || !userOwnsInstance ? (
              <ReactCodeMirror
                className={classes.instanceDetailsCodeMirror}
                value={instanceText ? instanceText : ""}
                options={{
                  lineWrapping: true,
                  mode: "scheme",
                  theme: "material",
                  lineNumbers: true,
                  matchBrackets: true,
                  autoCloseBrackets: true,
                  styleActiveLine: true,
                }}
              />
            ) : (
              <ReactCodeMirror
                className={classes.instanceDetailsCodeMirror}
                value={instanceText ? instanceText : ""}
                options={{
                  lineWrapping: true,
                  mode: "scheme",
                  theme: "material",
                  lineNumbers: true,
                  matchBrackets: true,
                  autoCloseBrackets: true,
                  styleActiveLine: true,
                }}
                onChange={(editor, data, value) => {
                  let codeText = value;
                  setInstance({ ...instance, text: value });

                  clearTimeout(changeTimer);
                  changeTimer = setTimeout(() => {
                    if (codeText !== previousText) {
                      debounce(
                        () => (
                          updateInstance({ ...instance, text: codeText }),
                          setPreviousText(codeText)
                        ),
                        debounceWait
                      );
                    } else {
                      return;
                    }
                  }, 1000);
                }}
              />
            )}
          </div>
        </div>
      ) : (
        <div role="alert">{error ? <p className="red">{error}</p> : null}</div>
      )}
    </>
  );
}
