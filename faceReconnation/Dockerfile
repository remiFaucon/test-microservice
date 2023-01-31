FROM python:3.10
WORKDIR /app
COPY requirements.txt .
RUN apt-get update && apt-get install -y cmake
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python3", "faceReconnation.py"]