from django.apps import AppConfig


class ContentsConfig(AppConfig):
    name = 'contents'

    def ready(self):
        import contents.signals
