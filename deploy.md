## Deploy and Verify

Note: this is optional since the contract is already deployed and verified, with address stored in `deployments.json`

### Deploy

```shell
$ npm run simple-increment -- --deploy
```

or with foundry:

```shell
forge create --account monad-deployer src/Counter.sol:Counter --broadcast
```

### Verify

```shell
forge verify-contract \
  <contract_address> \
  src/Counter.sol:Counter \
  --chain 10143 \
  --verifier sourcify \
  --verifier-url https://sourcify-api-monad.blockvision.org
  ```

### Or in 1 step

```shell
forge create \
  --account monad-deployer \
  src/Counter.sol:Counter \
  --broadcast \
  --verify \
  --verifier sourcify \
  --verifier-url https://sourcify-api-monad.blockvision.org
```
