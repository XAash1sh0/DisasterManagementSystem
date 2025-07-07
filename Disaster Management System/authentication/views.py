

# Create your views here.
from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib.auth.models import User
from django.contrib import messages
from django.core.mail import EmailMessage, send_mail
from dportal import settings
from django.contrib.sites.shortcuts import get_current_site
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_bytes, force_str  # updated from force_text
from django.contrib.auth import authenticate, login, logout
from .tokens import generate_token


def home(request):
    return render(request, 'authentication/index.html')


from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse

from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib import messages
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse

def signup(request):
    if request.method == "POST":
        username = request.POST.get('username', '')
        fname = request.POST.get('fname', '')
        lname = request.POST.get('lname', '')
        email = request.POST.get('email', '')
        pass1 = request.POST.get('pass1', '')
        pass2 = request.POST.get('pass2', '')

        # === Your existing validations here ===
        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists! Please try another.")
            return render(request, "authentication/signup.html", {
                'username': username,
                'fname': fname,
                'lname': lname,
                'email': email
            })

        if User.objects.filter(email=email).exists():
            messages.error(request, "Email already registered!")
            return render(request, "authentication/signup.html", {
                'username': username,
                'fname': fname,
                'lname': lname,
                'email': email
            })

        if len(username) > 20:
            messages.error(request, "Username must be under 20 characters!")
            return render(request, "authentication/signup.html", {
                'username': username,
                'fname': fname,
                'lname': lname,
                'email': email
            })

        if pass1 != pass2:
            messages.error(request, "Passwords didn't match! Please enter password again.")
            return render(request, "authentication/signup.html", {
                'username': username,
                'fname': fname,
                'lname': lname,
                'email': email
            })

        if not username.isalnum():
            messages.error(request, "Username must be alphanumeric!")
            return render(request, "authentication/signup.html", {
                'username': username,
                'fname': fname,
                'lname': lname,
                'email': email
            })

        # === Create user and send confirmation email ===
        try:
            myuser = User.objects.create_user(username, email, pass1)
            myuser.first_name = fname
            myuser.last_name = lname
            myuser.is_active = False
            myuser.save()
        except Exception as e:
            messages.error(request, f"Error creating account: {str(e)}")
            return render(request, "authentication/signup.html", {
                'username': username,
                'fname': fname,
                'lname': lname,
                'email': email
            })

        # Compose activation email
        subject = 'Activate your account'
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes

        uid = urlsafe_base64_encode(force_bytes(myuser.pk))
        token = generate_token.make_token(myuser)

        activation_link = request.build_absolute_uri(
         reverse('activate-account', kwargs={'uidb64': uid, 'token': token})
)

        message = f"Hi {fname},\n\nPlease click the link below to activate your account:\n{activation_link}\n\nThank you!"
        from_email = settings.EMAIL_HOST_USER
        recipient_list = [email]

        try:
            send_mail(subject, message, from_email, recipient_list, fail_silently=False)
        except Exception as e:
            messages.warning(request, f"Account created but failed to send confirmation email: {e}")

        messages.success(
            request,
            "Account created successfully! Please confirm your email address to activate your account."
        )
        return redirect('signin')

    # GET request: show empty signup form
    return render(request, "authentication/signup.html")




def activate(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        myuser = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        myuser = None

    if myuser is not None and generate_token.check_token(myuser, token):
        myuser.is_active = True
        myuser.save()
        login(request, myuser)
        messages.success(request, "Your account has been activated!")
        return redirect('signin')
    else:
        return render(request, 'activation_failed.html')
    
   


def signin(request):
    if request.method == 'POST':
        username = request.POST['username']
        pass1 = request.POST['pass1']

        user = authenticate(username=username, password=pass1)

        if user is not None:
            login(request, user)
            messages.success(request, "Logged in successfully!")
            return redirect('home')
        else:
            messages.error(request, "Invalid credentials! Please enter the correct username and password.")
            request.session['username'] = username
            return redirect('signin')

    return render(request, 'authentication/signin.html')

def signout(request):
    logout(request)
    messages.success(request, "Logged out successfully!")
    return redirect('home')

def about_view(request):
    return render(request, 'about/about.html')  # or 'authentication/about.html' if stored there

