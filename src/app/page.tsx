'use client'

import { callManyTimes, getPublicKey, getSenderBalance } from '@/app/_actions'
import { useEffect, useState } from 'react'

export const maxDuration = 300

export default function Home() {
  const [output, setOutput] = useState('')
  const [faucetBalance, setFaucetBalance] = useState('')
  const [pubKey, setPubKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.target as HTMLFormElement)
      const functionName = formData.get('functionName') as string
      const imInput = formData.get('imInput') as string
      const copies = formData.get('copies') as string

      // input validation
      if (!['incrementMany', 'pushMany', 'freeMany'].includes(functionName)) {
        setOutput('Invalid function name ' + functionName)
        setIsLoading(false)
        return
      }

      const imInputNumber = parseInt(imInput)
      // check if imInputNumber is a positive integer
      if (isNaN(imInputNumber) || imInputNumber < 1) {
        setOutput('Invalid input' + imInputNumber)
        setIsLoading(false)
        return
      }

      if (functionName === 'incrementMany' && imInputNumber > 400000) {
        setOutput('Invalid input for incrementMany: ' + imInputNumber + 
          '; exceeds block gas limit (150M); please pick a number between 1 and 400k')
        setIsLoading(false)
        return
      }
      if (functionName === 'pushMany' && imInputNumber > 6500) {
        setOutput('Invalid input for pushMany: ' + imInputNumber + 
          '; exceeds block gas limit (150M); please pick a number between 1 and 6500')
        setIsLoading(false)
        return
      }

      const copiesNumber = parseInt(copies)
      if (isNaN(copiesNumber) || copiesNumber < 1 || copiesNumber > 10) {
        setOutput('Invalid copies: ' + copiesNumber + '; please pick a number between 1 and 10')
        setIsLoading(false)
        return
      }
      
      const output = await callManyTimes(functionName, imInputNumber, copiesNumber)
      const outputString = output.join('<br>')
      setOutput(outputString)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setOutput(`Error: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const updateBalanceBox = async () => {
    setPubKey(await getPublicKey())
    setFaucetBalance(await getSenderBalance())
  }

  useEffect(() => {
    updateBalanceBox()
  }, [])

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-0 sm:p-15 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h2>
          <b>Send a big transaction</b>
        </h2>

        <p>
          Sender ({pubKey}) balance: {faucetBalance}
        </p>

        <form onSubmit={handleFormSubmit}>
        <b>functionName:</b>
        <br />
          <select name="functionName" defaultValue="incrementMany"
          style={{
            border: '1px solid black',
            padding: '5px 10px',
            position: 'relative',
            borderRadius: '5px',
          }}>
            <option value="incrementMany">incrementMany</option>
            <option value="pushMany">pushMany</option>
            <option value="freeMany">freeMany</option>
          </select>
          <br />
          <br />
          <b>argument (max 400k):</b>
          <br />
          <input 
            type="text" name="imInput" placeholder="number" defaultValue="10000" size={42}
            style={{
              border: '1px solid black',
              padding: '5px 10px',
              position: 'relative',
              borderRadius: '5px',
            }}/>
          <br />
          <br />
          <b>copies (be reasonable pls):</b>  
          <br />
          <input 
            type="text" name="copies" placeholder="copies" defaultValue="1" size={42}
            style={{
              border: '1px solid black',
              padding: '5px 10px',
              position: 'relative',
              borderRadius: '5px',
            }}/>
          <br />
          <br />
          <button
            type="submit"
            disabled={isLoading}
            style={{
              border: '1px solid black',
              padding: '5px 10px',
              position: 'relative',
              borderRadius: '5px',
            }}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                Sending...
              </div>
            ) : (
              'Send'
            )}
          </button>
        </form>
        <hr />

        <b>Output:</b>
        <div
          id="output-box"
          className="w-full h-full bg-gray-100 rounded-lg p-4"
          dangerouslySetInnerHTML={{ __html: output }}
        />
        <br/>
        <b>Feedback or suggestions? Want to build on Monad?</b>
        <ul>
          <li><a href="https://github.com/monadlabs/monad-testnet-faucet"><b>Open a PR</b></a></li>
          <li>Join the <a href="http://discord.gg/monaddev"><b>Discord</b></a></li>
          <li>Check out the <a href="https://docs.monad.xyz"><b>docs</b></a></li>
        </ul>
      </main>
    </div>
  )
}
