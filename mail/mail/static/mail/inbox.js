document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);


  // By default, load the inbox
  load_mailbox('inbox');
  
});

function compose_email(recipients = '', subject = '', body = '') {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = recipients;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;

  document.querySelector('form').onsubmit = function() {
  
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector("#compose-recipients").value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);
    });
    load_mailbox('sent');
  }
  


} 

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

      emails.forEach(email => {
        const emailElement = document.createElement('div');
        emailElement.className = 'email-box';
        if (email.read) {
          emailElement.classList.add('email-unread');
        }
        if (mailbox === 'inbox') {
          emailElement.innerHTML += `
            <div style="display: flex; justify-content: space-between;">
              <span>${email.sender}</span>
              <span>${email.subject}</span>
              <span style="margin-left: auto;">${email.timestamp}</span>
            </div><br>`;
        }
        if (mailbox === 'sent') {
          emailElement.innerHTML += `
            <div style="display: flex; justify-content: space-between;">
            <span>${email.recipients}</span>
            <span>${email.subject}</span>
            <span style="margin-left: auto;">${email.timestamp}</span>
          </div><br>`;
        }
        
        if (mailbox === 'archive') {
          emailElement.innerHTML += `
          <div style="display: flex; justify-content: space-between;">
              <span>${email.sender}</span>
              <span>${email.subject}</span>
              <span style="margin-left: auto;">${email.timestamp}</span>
            </div><br>`;

          
        }
        emailElement.addEventListener('click', function(){
          email_read(email.id);
          view_email(email.id);
        });

        
        

        document.querySelector('#emails-view').append(emailElement)
      });



      // Process emails 
      console.log(emails);

      
  
      
  })
  .catch(error => {
      console.error('Error fetching emails:', error);
  });

  
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
}



function view_email(email_id) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
      if (!email.archived){
        document.querySelector('#email-view').innerHTML = `
        <div>
            Time: ${email.timestamp}<br>
            Recepients: ${email.recipients}<br>
            Sender: ${email.sender}<br>
            Subject: ${email.subject}<br>
            

            <button class="btn btn-sm btn-outline-primary" id="archive">Archive</button>
            <button class="btn btn-sm btn-outline-primary" id="reply">Reply</button><br><br>

            ${email.body}<br><br>
          </div>`;
        document.querySelector('#archive').addEventListener('click', function() {
          archive_email(email_id);
        });
        document.querySelector('#reply').addEventListener('click', function() {
          reply_email(email_id);
        });
      }
      else {
        document.querySelector('#email-view').innerHTML = `
        <div>
            Time: ${email.timestamp}<br>
            Recepients: ${email.recipients}<br>
            Sender: ${email.sender}<br>
            Subject: ${email.subject}<br>
            

            <button class="btn btn-sm btn-outline-primary" id="unarchive">Unarchive</button>
            <button class="btn btn-sm btn-outline-primary" id="reply">Reply</button><br><br>

            ${email.body}<br><br>
          </div>`;
        document.querySelector('#unarchive').addEventListener('click', function() {
          unarchive_email(email_id);
        });
        document.querySelector('#reply').addEventListener('click', function() {
          reply_email(email_id);
        });
      }
    });


}


function email_read(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
  .then(response => {
    if (response.ok) {
      console.log(`Email ${email_id} marked as read`);
    } else {
      console.error(`Failed to mark email ${email_id} as read`);
    }
  });
}

function unarchive_email(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: false
    })
  })
  .then(response => {
    if (response.ok) {
      console.log(`Email ${email_id} marked as archived`);
      load_mailbox('inbox');
    } else {
      console.error(`Failed to mark email ${email_id} as archived`);
    }
  });
}

function archive_email(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: true
    })
  })
  .then(response => {
    if (response.ok) {
      console.log(`Email ${email_id} marked as unarchived`);
      load_mailbox('inbox');
    } else {
      console.error(`Failed to mark email ${email_id} as unarchived`);
    }
  });
}

function reply_email(email_id) {
  fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
      // Prepare pre-filled values for the reply
      const recipients = email.sender;
      const subject = email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`;
      const body = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;

      // Call compose_email with pre-filled values
      compose_email(recipients, subject, body);
    });
}