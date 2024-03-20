include .env

deploy_all:
	@forge script script/DeployScript.s.sol:DeployScript --rpc-url ${RPC_URL} --private-key ${PRIV_KEY} --sig "run()" --broadcast