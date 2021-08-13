<script>

  export let token;
  export let known_port;


  import { createEventDispatcher } from 'svelte';
  //const dispatch = createEventDispatcher();


  function dedup_list(d_list) {
    let d_map = {}
    for ( let dat of d_list ) {
      d_map[dat] = 1
    }
    let o_list = Object.keys(d_map)
    return o_list
  }


  let informed = ''
  let have_info = false

  const nmap_prefix = "Nmap scan report for "

  const handleIPSReq  = async () => { 
    informed = ''
    have_info = false
    let endpoint = `lan-ips/${token}`
    let info = await fetchEndPoint(endpoint,known_port)
    if ( info.status == "OK" ) {
      have_info = true
      let data = info.data
      if ( Array.isArray(data) ) {
          informed += `
              <div class="data-row">
                ${nmap_prefix}
              </div>
            `
          for ( let elem of data ) {
            elem = elem.replace(nmap_prefix,'')
            let display_els = elem.trim().split(' ')
            let [dns_str, ip] = display_els
            dns_str = (dns_str.split('.'))[0]
            informed += `
              <div class="data-row">
                ${dns_str} :=> ${ip}
              </div>
            `
          }

      }
    }
  }

  const handleConnectedIPSReq = async () => {
    informed = ''
    have_info = false
    let endpoint = `ips/${token}`
    let info = await fetchEndPoint(endpoint,known_port)
    if ( info.status == "OK" ) {
      have_info = true
      let data = info.data
      if ( typeof data === 'string' ) {
        informed = data
      } else {
        if ( Array.isArray(data) ) {
          //data.shift()
          //data.shift()
          let foreigns = data.map(drow => {
            drow = drow.trim()
            if ( drow.length === 0 ) return ['tcp4','']
            drow = drow.replace(/\s+/g,' ')
            let elems = drow.trim().split(' ')
            let iptype = elems[0]
            let ip = elems[4].trim()
            if ( iptype !== 'tcp6') {
              ip = (ip.split(':'))[0]
            }
            if ( iptype === "tcp" ) {
              iptype = "tcp4"
            }
            return [iptype,ip]
          })

          let ips_of_type = {
            'tcp4' : [],
            'tcp6' : []
          }
          
          for ( let pair of foreigns ) {
            let [ip_type,ip] = pair
            if ( ip.length ) {
              ips_of_type[ip_type].push(ip)
            }
          }

          let quad_comp = (a,b) => {
            let apart = a.split('.')
            let bpart = b.split('.')
            let n = Math.min(apart.length,bpart.length)
            for ( let i = 0; i < n; i++ ) {
              let ia = parseInt(apart[i])
              let ib = parseInt(bpart[i])
              if ( ia < ib ) return(-1)
              if ( ia > ib ) return(1)
            }
            return 0
          }

          let penta_comp = (a,b) => {
            let apart = a.split(':')
            let check_a = apart[0]
            if ( check_a.indexOf('.') > 0 ) {
              let ca_parts = check_a.split('.')
              ca_parts.push(apart[1])
              apart = ca_parts
            }
            let bpart = b.split(':')
            let check_b = bpart[0]
            if ( check_b.indexOf('.') > 0 ) {
              let cb_parts = check_b.split('.')
              cb_parts.push(bpart[1])
              bpart = cb_parts
            }
            let n = Math.min(apart.length,bpart.length)
            for ( let i = 0; i < n; i++ ) {
              let ia = parseInt(apart[i])
              let ib = parseInt(bpart[i])
              if ( ia < ib ) return(-1)
              if ( ia > ib ) return(1)
            }
            return 0
          }

          const valued_prefix = "192.168"
          const loopback = "127.0.0.1"
          let biased_comp = (part_com) => { return (a,b) => {
            if ( a.indexOf(loopback) === 0 ) {
              if ( b === a ) return 0
              return -1
            }
            if ( b.indexOf(loopback) === 0 ) {
              if ( b === a ) return 0
              return 1
            }
            let a_is_v = (a.indexOf(valued_prefix) === 0)
            let b_is_v = (b.indexOf(valued_prefix) === 0)
            if ( a_is_v && b_is_v ) {
              if ( a === b ) return 0
              return part_com(a,b)
            }
            if ( a_is_v ) {
              return -1
            } else if ( b_is_v ) {
              return 1
            }
            if ( a === b ) return 0
            return part_com(a,b)
          }}

          foreigns = dedup_list(ips_of_type.tcp4)
          foreigns.sort(biased_comp(quad_comp))
          informed = informed += `
              <div class="data-row">
                TCP 4
              </div>
            `
          for ( let elem of foreigns ) {
            informed += `
              <div class="data-row">
                ${elem}
              </div>
            `
          }

          // ---- ---- ---- ---- ---- ----  ---- ---- ----  ---- ---- ----  ---- ---- ---- 
          foreigns = dedup_list(ips_of_type.tcp6)
          foreigns.sort(biased_comp(penta_comp))
          informed += `
              <div class="data-row">
                TCP6
              </div>
            `
          for ( let elem of foreigns ) {
            informed += `
              <div class="data-row">
                ${elem}
              </div>
            `
          }
        }
      }
    } else {
      have_info = false
    }
  };
</script>

<style>

  label {
    margin: 10px 0;
    align-self: flex-start;
    font-weight: 500;
  }

  input {
    border: none;
    border-bottom: 1px solid #ccc;
    margin-bottom: 20px;
    transition: all 300ms ease-in-out;
    width: 100%;
  }

  input:focus {
    outline: 0;
    border-bottom: 1px solid #666;
  }

  button {
    margin-top: 20px;
    background: black;
    color: white;
    padding: 10px 0;
    width: 100px;
    border-radius: 15px;
    text-transform: uppercase;
    font-weight: bold;
    cursor: pointer;
    transition: all 300ms ease-in-out;
  }

  button:hover {
    transform: translateY(-2.5px);
    box-shadow: 0px 1px 10px 0px rgba(0, 0, 0, 0.58);
  }

  h1 {
    margin: 10px 20px 30px 20px;
    font-size: 40px;
  }

  .errors {
    list-style-type: none;
    padding: 10px;
    margin: 0;
    border: 2px solid #be6283;
    color: #be6283;
    background: rgba(190, 98, 131, 0.3);
  }

  .success {
    font-size: 24px;
    text-align: center;
  }
</style>

<div>
  <button on:click={handleConnectedIPSReq}>get connected ips</button>
  <button on:click={handleIPSReq}>get lan ips</button>
  {#if have_info}
  <div>
    {@html informed}
  </div>
  {/if}
</div>