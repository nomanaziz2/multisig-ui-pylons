import { useEffect, useState } from "react"
import SendMsgForm from "./transaction/SendMsg"
import DelegateMsgForm from "./transaction/DelegateMsg"
import UndelegateMsg from "./transaction/UndelegateMsg"
import WithdrawMsg from "./transaction/WithdrawMsg"
import RedelegateMsg from "./transaction/RedelegateMsg"
import VoteMsg from "./transaction/VoteMsg"
import Button from "../input/Button"
import { CloseOutlined } from "@ant-design/icons"
import { motion } from "framer-motion"
import { openLoadingNotification, openNotification } from "../ulti/Notification"
import { makeTxBody, checkIfHasPendingTx } from "../../libs/transaction"
import axios from "axios"
import ShareForm from "./transaction/ShareForm"
import WarningModal from "../ulti/WarningModal"
import MsgList from "../list/MsgList"

const style = {
    input: {
        marginBottom: "10px",
        color: "black"
    },
    button: {
        border: 0,
        borderRadius: "10px",
        width: "40%",
        padding: ".5em 1em"
    }
}

const TransactionCreate = ({ multisigID, chain, router, wrapSetClose }) => {
    const [txType, setTxType] = useState(0)
    const [checked, setChecked] = useState(false)
    const [msgs, setMsgs] = useState([])
    const [txBody, setTxBody] = useState({
        gas: 200000,
        fee: 0,
        memo: "",
    })
    const [showWarning, setShowWarning] = useState(false)

    const txTypes = [
        {
            type: "msgSend",
            component: (
                <SendMsgForm
                    chain={chain}
                    msgs={msgs}
                    setMsgs={setMsgs}
                    address={multisigID}
                    style={style}
                />
            )
        }, {
            type: "msgDelegate",
            component: (
                <DelegateMsgForm
                    chain={chain}
                    msgs={msgs}
                    setMsgs={setMsgs}
                    address={multisigID}
                    style={style}
                />
            )
        }, {
            type: "msgUndelegate",
            component: (
                <UndelegateMsg
                    chain={chain}
                    msgs={msgs}
                    setMsgs={setMsgs}
                    address={multisigID}
                    style={style}
                />
            )
        }, {
            type: "msgWithdraw",
            component: (
                <WithdrawMsg
                    chain={chain}
                    msgs={msgs}
                    setMsgs={setMsgs}
                    address={multisigID}
                    style={style}
                />
            )
        }, {
            type: "msgRedelegate",
            component: (
                <RedelegateMsg
                    chain={chain}
                    msgs={msgs}
                    setMsgs={setMsgs}
                    address={multisigID}
                    style={style}
                />
            )
        },
        {
            type: "msgVoteProposal",
            component: (
                <VoteMsg
                    chain={chain}
                    msgs={msgs}
                    setMsgs={setMsgs}
                    address={multisigID}
                    style={style}
                />
            )
        }
    ]

    useEffect(() => {
        const notShowWarning = localStorage.getItem("not-show-warning")
        if (notShowWarning && notShowWarning === "true") {
            setChecked(notShowWarning)
        }
    }, [])

    const getForm = () => {
        return txTypes[txType].component
    }

    const createTx = async () => {
        openLoadingNotification("open", "Creating transaction")
        try {
            const tx = makeTxBody(
                msgs,
                txBody.gas,
                chain.denom,
                txBody.memo,
                chain.chain_id,
                txBody.fee,

            );
            const dataJSON = JSON.stringify(tx);
            const data = {
                dataJSON,
                createBy: multisigID,
                status: "PENDING"
            }
            const res = await axios.post("/api/transaction/create", data);
            const { _id } = res.data;
            router.push(`/multisig/${multisigID}/transaction/${_id}`)
            openLoadingNotification("close")
            openNotification("success", "Created successfully")
        }
        catch (e) {
            openLoadingNotification("close")
            openNotification("error", e.message)
        }
    }

    const handleKeyGroupChange = (e) => {
        if (e.target.name === "fee" || e.target.name === "gas") {
            setTxBody({
                ...txBody,
                [e.target.name]: parseFloat(e.target.value)
            })
        }
        else {
            setTxBody({
                ...txBody,
                [e.target.name]: e.target.value
            })
        }
    }

    const handleProcced = async () => {
        const check = await checkIfHasPendingTx(multisigID)
        if (check && !checked) {
            setShowWarning(true)
        }
        else {
            await createTx()
        }
    }

    const handleCancel = () => {
        setShowWarning(false)
        openNotification("error", "Cancel create transaction")
    }

    const handleClose = () => {
        setShowWarning(false)
    }

    const invalidForm = () => {
        for (let key in txBody) {
            if (key !== "memo" && txBody[key] === "") return true
            else if (key === "amount" && txBody[key] === 0) return true
        }
        return false
    }

    const disabled = () => {
        if (invalidForm() || msgs.length === 0) {
            return true
        }
        return false
    }

    const removeMsg = (index) => {
        let messages = [...msgs]
        messages.splice(index, 1);
        setMsgs([...messages])
    }

    return (
        <motion.div
            initial={{
                y: -60,
                opacity: 0,

            }}
            animate={{
                y: 0,
                opacity: 1
            }}
            style={{
                backgroundColor: "#ffffff",
                boxShadow: " 0px 0px 20px 2px rgba(0, 0, 0, 0.25)",
                padding: "2em 3em",
                borderRadius: "10px",
                position: "relative",
                zIndex: 1,
                width: "100%",
                marginTop: "50px"
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px"
                }}
            >
                <h2
                    style={{
                        marginBottom: 0,
                        textAlign: "left"
                    }}
                >
                    Create Transaction
                </h2>
                <Button
                    text={(
                        <CloseOutlined />
                    )}
                    style={{
                        position: "relative",
                        top: "0px",
                        border: 0,
                        backgroundColor: "transparent",
                        fontWeight: "bold",
                        fontSize: "1.25rem"
                    }}
                    clickFunction={wrapSetClose}
                />
            </div>
            <h3
                style={{
                    marginBottom: 0
                }}
            >
                Messages
            </h3>
            <MsgList
                msgs={msgs}
                removeMsg={removeMsg}
            />
            <div
                style={{
                    backgroundColor: "#ffffff",
                    boxShadow: " 0px 0px 20px 2px rgba(0, 0, 0, 0.25)",
                    padding: "2em 3em",
                    borderRadius: "10px",
                    position: "relative",
                    zIndex: 1,
                    width: "100%",
                    margin: "20px 0 20px 0"
                }}
            >
                <h3
                    style={{
                        marginBottom: 0
                    }}
                >
                    Message Type
                </h3>
                <select
                    defaultValue={0}
                    placeholder={"Select message type"}
                    onChange={(e) => {
                        setTxType(e.target.value)
                    }}
                    style={{
                        marginBottom: "10px",
                        width: "100%",
                        borderRadius: "10px",
                        padding: "1em"
                    }}
                >
                    {txTypes.map((type, index) => {
                        return (
                            <option
                                key={index}
                                value={index}
                                style={{
                                    padding: "1em"
                                }}
                            >
                                {type.type}
                            </option>
                        )
                    })}
                </select>
                {
                    getForm()
                }
            </div>
            <ShareForm
                txBody={txBody}
                handleKeyGroupChange={(e) => {
                    handleKeyGroupChange(e);
                }}
                handleCreate={handleProcced}
                chain={chain}
                style={style}
                disabled={disabled()}
            />
            <WarningModal
                style={style}
                handleClose={handleClose}
                handleCreate={createTx}
                showWarning={showWarning}
                handleCancel={handleCancel}
                checked={checked}
                setChecked={setChecked}
            />
        </motion.div>
    )
}

export default TransactionCreate