<script>
  import { onMount, setContext } from "svelte";

  import {
    key as userContextKey,
    initialValue as userContextInitialValue
  } from "./userContext";

  import LoginForm from "./LoginForm.svelte";
  import InfoForm from "./InfoForm.svelte";



  const known_port = '7111'
  const site_url =   "localhost"   //"76.229.181.242"
  set_site_url(site_url)
  


  onMount(() => {
    setContext(userContextKey, userContextInitialValue);
  });

  let token = false
  let show_logout = false
  let logged_in = false

  async function handle_message(evt) {
		let cmd = evt.detail.cmd
		switch ( cmd ) {
			case "ui-loggin-ack" : {
        show_logout = true
        logged_in = true
        break;
      }
      default: {
        break;
      }
    }
  }


  async function handle_logout(evt) {
    show_logout = false
    logged_in = false
    let endpoint = `logout/${token}`
    let result = await fetchEndPoint(endpoint,known_port)
    if ( result.status === "OK" ) {
      token = false
    } else {
      show_logout = true
      logged_in = true
    }
  }


  const submit = async ({ email, password }) => {
    let url = `http://${site_url}:${known_port}/login`
    let data = {
      email, password
    }
    let response = await postData(url, data)
    console.log(response)
    if ( response.status == "OK" ) {
      setContext(userContextKey, {
          "name": "Foo",
          "lastName": "Bar",
          "email": email
        });
    }
    token = response.token
    return response.token
  };
</script>

<style>
  section {
    height: 100vh;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(to right, #cfeb90, #fdf8cb);
  }

  .token-display {
    color:aqua;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    float:right;
  }
  
  .top-info {
    border: 1px solid navy;
    padding: 6px;
    width: 100%;
    height: 40px;
  }
</style>

{#if token }
<div class="top-info">
  <div class="token-display">
    {token} 
    {#if show_logout}
    <button on:click={handle_logout}>logout</button>
    {/if}
  </div>
</div>
{/if}

{#if logged_in }
<section>
  <InfoForm {token} {known_port} />
</section>
{:else}
<section>
  <LoginForm {submit} on:message={handle_message} />
</section>
{/if}